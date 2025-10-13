#!/usr/bin/env node
import { parse } from 'csv-parse/sync'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import pLimit from 'p-limit'
import { prisma } from '../lib/prisma'
import {
  fetchText,
  sha256,
  mapCellToRunType,
  slugify,
  shortHash,
  normalizeWhitespace,
  parseMapCreator,
  getGMFromStars,
  extractAllUrls,
} from './utils.js'
import { extractSheetId, fetchGoogleSheet, sheetDataToCsvFormat } from './sheets.js'

interface ImportArgs {
  csv?: string
  sheet?: string
  sheetName?: string
  snapshotsDir: string
  dryRun: boolean
}
interface ParsedRow {
  mapName: string
  creatorName: string
  stars: number | null
  canonicalVideoUrl: string | null
  playerData: Record<string, string>
}

function parseArgs(): ImportArgs {
  const args = process.argv.slice(2)
  let csv: string | undefined
  let sheet: string | undefined
  let sheetName: string | undefined
  let snapshotsDir = './snapshots'
  let dryRun = false
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--csv' && i + 1 < args.length) {
      csv = args[i + 1]
      i++
    } else if (args[i] === '--sheet' && i + 1 < args.length) {
      sheet = args[i + 1]
      i++
    } else if (args[i] === '--sheet-name' && i + 1 < args.length) {
      sheetName = args[i + 1]
      i++
    } else if (args[i] === '--snapshots-dir' && i + 1 < args.length) {
      snapshotsDir = args[i + 1]
      i++
    } else if (args[i] === '--dry-run') {
      dryRun = true
    }
  }
  if (!csv && !sheet) {
    console.error('Error: Either --csv or --sheet is required')
    console.error('Usage:')
    console.error('  npm run import -- --csv <url-or-path> [--snapshots-dir ./snapshots] [--dry-run]')
    console.error('  npm run import -- --sheet <google-sheets-url> [--sheet-name "Sheet1"] [--dry-run]')
    console.error('')
    console.error('Options:')
    console.error('  --dry-run    Show what would be changed without modifying the database')
    process.exit(1)
  }
  return { csv, sheet, sheetName, snapshotsDir, dryRun }
}

function getStarRatingFromHeader(firstColumn: string): number | null {
  if (!firstColumn) return null
  const starCount = (firstColumn.match(/⭐/g) || []).length
  if (starCount > 0) return null
  return null
}

function isHeaderOrSummaryRow(firstColumn: string): boolean {
  if (!firstColumn || firstColumn.trim() === '') return true
  const normalized = firstColumn.toLowerCase().trim()
  if (normalized.includes('⭐') || normalized.includes('★')) return true
  if (normalized.includes('total:')) return true
  if (/^-?\d+$/.test(normalized)) return true
  return false
}

function hasReachedRealMaps(mapName: string): boolean {
  return mapName.toLowerCase().includes('reach for the stars')
}

function parseRow(
  row: string[],
  playerColumns: { name: string; index: number }[],
  currentStars: number | null
): ParsedRow | null {
  const mapCreatorCell = row[0]?.trim()
  if (!mapCreatorCell || isHeaderOrSummaryRow(mapCreatorCell)) return null
  const parsed = parseMapCreator(mapCreatorCell)
  if (!parsed) {
    console.warn(`   ⚠️  Could not parse map/creator from: "${mapCreatorCell}"`)
    return null
  }
  const videoCell = row[3]?.trim() || ''
  const urls = videoCell ? extractAllUrls(videoCell) : []
  const canonicalVideoUrl = urls.length > 0 ? urls[0] : null
  const playerData: Record<string, string> = {}
  for (const player of playerColumns) {
    if (player.index < row.length && row[player.index]) {
      const cellValue = row[player.index].trim()
      if (cellValue) playerData[player.name] = cellValue
    }
  }
  return {
    mapName: normalizeWhitespace(parsed.mapName),
    creatorName: normalizeWhitespace(parsed.creatorName),
    stars: currentStars,
    canonicalVideoUrl,
    playerData,
  }
}

async function generateUniqueSlug(mapName: string): Promise<string> {
  const baseSlug = slugify(mapName)
  const existing = await prisma.map.findUnique({ where: { slug: baseSlug } })
  if (!existing || existing.name === mapName) return baseSlug
  const hash = shortHash(mapName)
  return `${baseSlug}-${hash}`
}

async function runImport() {
  const startTime = Date.now()
  const args = parseArgs()
  const { csv: csvSource, sheet: sheetSource, sheetName, snapshotsDir } = args
  console.log('\nStarting Celeste Hardlist Import')
  let content: string
  let sourceUrl: string
  let records: string[][]
  if (sheetSource) {
    console.log(`Source: Google Sheets`)
    console.log(`   URL: ${sheetSource}`)
    sourceUrl = sheetSource
    console.log('Fetching from Google Sheets API...')
    const spreadsheetId = extractSheetId(sheetSource)
    console.log(`   Spreadsheet ID: ${spreadsheetId}`)
    const sheetData = await fetchGoogleSheet(spreadsheetId, sheetName)
    console.log(`   Fetched ${sheetData.length} rows with hyperlinks preserved`)
    records = sheetDataToCsvFormat(sheetData)
    content = records.map(row => row.join(',')).join('\n')
  } else if (csvSource) {
    console.log(`Source: ${csvSource}`)
    sourceUrl = csvSource
    console.log('')
    console.log('Fetching CSV...')
    content = await fetchText(csvSource)
    records = []
  } else {
    throw new Error('No source specified')
  }
  const contentHash = sha256(content)
  const contentBytes = Buffer.byteLength(content, 'utf-8')
  console.log(`Content size: ${contentBytes} bytes`)
  console.log(`SHA256: ${contentHash}`)
  const existingSnapshot = await prisma.snapshot.findUnique({ where: { sha256: contentHash } })

  await mkdir(snapshotsDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const snapshotPath = join(snapshotsDir, `${timestamp}.csv`)
  await writeFile(snapshotPath, content, 'utf-8')
  console.log(`Saved snapshot: ${snapshotPath}`)
  console.log('\nParsing data...')
  if (records.length === 0) {
    records = parse(content, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: false,
    }) as string[][]
  }
  if (records.length < 2) throw new Error('CSV must have at least a header row and one data row')
  const headers = records[0]
  const playerColumns: { name: string; index: number }[] = []
  for (let i = 4; i < headers.length; i++) {
    const header = headers[i]?.trim()
    if (header && header !== '') playerColumns.push({ name: header, index: i })
  }
  playerColumns.sort((a, b) => a.name.localeCompare(b.name))
  console.log(`   Rows: ${records.length - 1}`)
  console.log(`   Players detected: ${playerColumns.length}`)
  console.log(`   First 5 players: ${playerColumns.slice(0, 5).map(p => p.name).join(', ')}`)
  console.log('')
  console.log('Processing rows...')
  const parsedRows: ParsedRow[] = []
  const skippedRows: number[] = []
  let hasStarted = false
  let currentStars: number | null = 8
  let mapsInCurrentSection = 0
  for (let i = 1; i < records.length; i++) {
    try {
      const firstCol = records[i][0]?.trim() || ''
      if (!hasStarted && firstCol) {
        const parsed = parseMapCreator(firstCol)
        if (parsed && hasReachedRealMaps(parsed.mapName)) {
          hasStarted = true
          console.log(`   Found first real map at row ${i + 1}: "${parsed.mapName}"`)
        }
      }
      if (!hasStarted) {
        skippedRows.push(i + 1)
        continue
      }
      const secondCol = records[i][1]?.trim().toLowerCase() || ''
      if (firstCol.toLowerCase().includes('total:') || secondCol.includes('total:')) {
        if (mapsInCurrentSection > 0 && currentStars && currentStars > 1) {
          currentStars--
          console.log(`   Moving to ${currentStars}-star section`)
          mapsInCurrentSection = 0
        }
        skippedRows.push(i + 1)
        continue
      }
      const parsed = parseRow(records[i], playerColumns, currentStars)
      if (parsed) {
        parsedRows.push(parsed)
        mapsInCurrentSection++
      } else {
        skippedRows.push(i + 1)
      }
    } catch (error) {
      console.error(`   Error on row ${i + 1}: ${(error as Error).message}`)
      throw error
    }
  }
  if (skippedRows.length > 0) console.log(`   Skipped ${skippedRows.length} header/summary rows`)
  console.log(`   Parsed ${parsedRows.length} valid map rows`)
  console.log('')
  if (args.dryRun) {
    console.log('DRY RUN - Analyzing differences with database (no changes will be made)...')
  } else {
    console.log('Analyzing differences with database...')
  }
  
  // Collect all unique entities from parsed data
  const uniqueCreators = new Set<string>()
  const uniquePlayers = new Set<string>()
  const mapNames = new Set<string>()
  
  for (const row of parsedRows) {
    uniqueCreators.add(row.creatorName)
    mapNames.add(row.mapName)
    Object.keys(row.playerData).forEach(p => uniquePlayers.add(p))
  }

  // Fetch existing data from database
  console.log('   Fetching existing data...')
  const [existingCreators, existingPlayers, existingMaps, existingRuns] = await Promise.all([
    prisma.creatorProfile.findMany({
      where: { name: { in: [...uniqueCreators] } },
      select: { id: true, name: true },
    }),
    prisma.player.findMany({
      where: { handle: { in: [...uniquePlayers] } },
      select: { id: true, handle: true },
    }),
    prisma.map.findMany({
      where: { name: { in: [...mapNames] } },
      select: { 
        id: true, 
        name: true, 
        stars: true, 
        gmColor: true, 
        gmTier: true, 
        canonicalVideoUrl: true 
      },
    }),
    prisma.run.findMany({
      where: {
        map: { name: { in: [...mapNames] } },
        player: { handle: { in: [...uniquePlayers] } }
      },
      select: {
        id: true,
        mapId: true,
        playerId: true,
        type: true,
        evidenceUrls: true,
        map: { select: { name: true } },
        player: { select: { handle: true } }
      }
    })
  ])

  // Create lookup maps
  const creatorIdByName = new Map(existingCreators.map(r => [r.name, r.id]))
  const playerIdByHandle = new Map(existingPlayers.map(r => [r.handle, r.id]))
  const mapIdByName = new Map(existingMaps.map(m => [m.name, m.id]))
  const existingMapByName = new Map(existingMaps.map(m => [m.name, m]))
  
  // Track what needs to be created/updated
  const creatorsToCreate: string[] = []
  const playersToCreate: string[] = []
  const mapsToCreate: any[] = []
  const mapsToUpdate: { id: string; data: any }[] = []
  const runsToCreate: any[] = []
  const runsToUpdate: { id: string; data: any }[] = []

  // Find missing creators
  for (const creatorName of uniqueCreators) {
    if (!creatorIdByName.has(creatorName)) {
      creatorsToCreate.push(creatorName)
    }
  }

  // Find missing players
  for (const playerHandle of uniquePlayers) {
    if (!playerIdByHandle.has(playerHandle)) {
      playersToCreate.push(playerHandle)
    }
  }

  // Find missing maps and maps that need updates
  for (const row of parsedRows) {
    const existingMap = existingMapByName.get(row.mapName)
    const gm = row.stars ? getGMFromStars(row.stars) : null
    
    if (!existingMap) {
      // Map doesn't exist, need to create it
      // Check if creator exists or will be created
      const creatorExists = creatorIdByName.has(row.creatorName)
      const creatorWillBeCreated = creatorsToCreate.includes(row.creatorName)
      
      if (creatorExists || creatorWillBeCreated) {
        const slug = await generateUniqueSlug(row.mapName)
        mapsToCreate.push({
          name: row.mapName,
          slug,
          creatorId: creatorExists ? creatorIdByName.get(row.creatorName) : null, // Will be resolved later
          creatorName: row.creatorName, // Store creator name for later resolution
          stars: row.stars,
          gmColor: gm?.color ?? null,
          gmTier: gm?.tier ?? null,
          canonicalVideoUrl: row.canonicalVideoUrl,
        })
      }
    } else {
      // Map exists, check if it needs updating
      const needsUpdate = 
        existingMap.stars !== row.stars ||
        existingMap.gmColor !== (gm?.color ?? null) ||
        existingMap.gmTier !== (gm?.tier ?? null) ||
        existingMap.canonicalVideoUrl !== row.canonicalVideoUrl
      
      if (needsUpdate) {
        mapsToUpdate.push({
          id: existingMap.id,
          data: {
            stars: row.stars,
            gmColor: gm?.color ?? null,
            gmTier: gm?.tier ?? null,
            canonicalVideoUrl: row.canonicalVideoUrl,
          }
        })
      }
    }
  }

  // Create missing entities first
  if (creatorsToCreate.length > 0) {
    if (args.dryRun) {
      console.log(`Would create ${creatorsToCreate.length} new creators:`)
    } else {
      console.log(`Creating ${creatorsToCreate.length} new creators:`)
    }
    creatorsToCreate.forEach(name => console.log(`      - ${name}`))
    
    if (!args.dryRun) {
      await prisma.creatorProfile.createMany({
        data: creatorsToCreate.map(name => ({ name })),
        skipDuplicates: true,
      })
      // Refresh creator lookup
      const newCreators = await prisma.creatorProfile.findMany({
        where: { name: { in: creatorsToCreate } },
        select: { id: true, name: true },
      })
      newCreators.forEach(c => creatorIdByName.set(c.name, c.id))
    }
  }

  if (playersToCreate.length > 0) {
    if (args.dryRun) {
      console.log(`Would create ${playersToCreate.length} new players:`)
    } else {
      console.log(`Creating ${playersToCreate.length} new players:`)
    }
    playersToCreate.forEach(handle => console.log(`      - ${handle}`))
    
    if (!args.dryRun) {
      await prisma.player.createMany({
        data: playersToCreate.map(handle => ({ handle })),
        skipDuplicates: true,
      })
      // Refresh player lookup
      const newPlayers = await prisma.player.findMany({
        where: { handle: { in: playersToCreate } },
        select: { id: true, handle: true },
      })
      newPlayers.forEach(p => playerIdByHandle.set(p.handle, p.id))
    }
  }

  if (mapsToCreate.length > 0) {
    if (args.dryRun) {
      console.log(`Would create ${mapsToCreate.length} new maps:`)
    } else {
      console.log(`Creating ${mapsToCreate.length} new maps:`)
    }
    mapsToCreate.forEach(map => console.log(`      - ${map.name} (${map.stars}⭐)`))
    
    if (!args.dryRun) {
      // Resolve creator IDs for maps that need them
      const mapsWithResolvedCreators = mapsToCreate.map(map => {
        if (map.creatorId === null && map.creatorName) {
          const resolvedCreatorId = creatorIdByName.get(map.creatorName)
          if (!resolvedCreatorId) {
            throw new Error(`Creator "${map.creatorName}" not found for map "${map.name}"`)
          }
          return { ...map, creatorId: resolvedCreatorId }
        }
        return map
      })
      
      await prisma.map.createMany({ 
        data: mapsWithResolvedCreators.map(({ creatorName, ...map }) => map), 
        skipDuplicates: true 
      })
      // Refresh map lookup
      const newMaps = await prisma.map.findMany({
        where: { name: { in: mapsToCreate.map(m => m.name) } },
        select: { id: true, name: true },
      })
      newMaps.forEach(m => mapIdByName.set(m.name, m.id))
    }
  }

  // Update existing maps
  if (mapsToUpdate.length > 0) {
    if (args.dryRun) {
      console.log(`Would update ${mapsToUpdate.length} existing maps:`)
    } else {
      console.log(`Updating ${mapsToUpdate.length} existing maps:`)
    }
    for (const update of mapsToUpdate) {
      const map = existingMaps.find(m => m.id === update.id)
      const changes = []
      if (map?.stars !== update.data.stars) changes.push(`stars: ${map?.stars} -> ${update.data.stars}`)
      if (map?.gmColor !== update.data.gmColor) changes.push(`gmColor: ${map?.gmColor} -> ${update.data.gmColor}`)
      if (map?.gmTier !== update.data.gmTier) changes.push(`gmTier: ${map?.gmTier} -> ${update.data.gmTier}`)
      if (map?.canonicalVideoUrl !== update.data.canonicalVideoUrl) changes.push(`video: ${map?.canonicalVideoUrl || 'none'} → ${update.data.canonicalVideoUrl || 'none'}`)
      console.log(`      - ${map?.name}: ${changes.join(', ')}`)
    }
    
    if (!args.dryRun) {
      const limit = pLimit(16)
      await Promise.all(
        mapsToUpdate.map(update => 
          limit(() => prisma.map.update({
            where: { id: update.id },
            data: update.data,
          }))
        )
      )
    }
  }

  // Process runs - find what needs to be created/updated
  console.log('   Analyzing runs...')
  const existingRunsByKey = new Map<string, any>()
  for (const run of existingRuns) {
    const key = `${run.mapId}-${run.playerId}-${run.type}`
    existingRunsByKey.set(key, run)
  }

  for (const row of parsedRows) {
    // Check if map exists or will be created
    const mapExists = mapIdByName.has(row.mapName)
    const mapWillBeCreated = mapsToCreate.some(m => m.name === row.mapName)
    
    if (!mapExists && !mapWillBeCreated) continue

    for (const [playerHandle, cellValue] of Object.entries(row.playerData)) {
      // Check if player exists or will be created
      const playerExists = playerIdByHandle.has(playerHandle)
      const playerWillBeCreated = playersToCreate.includes(playerHandle)
      
      if (!playerExists && !playerWillBeCreated) continue

      const runData = mapCellToRunType(cellValue)
      if (!runData) continue

      // For analysis phase, we can't determine the exact key without IDs
      // So we'll create runs for all valid combinations
      if (mapExists && playerExists) {
        // Both exist, check for existing run
        const mapId = mapIdByName.get(row.mapName)!
        const playerId = playerIdByHandle.get(playerHandle)!
        const key = `${mapId}-${playerId}-${runData.type}`
        const existingRun = existingRunsByKey.get(key)

        if (!existingRun) {
          // Run doesn't exist, create it
          runsToCreate.push({
            mapId,
            playerId,
            type: runData.type,
            evidenceUrls: runData.evidenceUrls,
            verifiedStatus: 'VERIFIED',
          })
        } else {
          // Run exists, check if evidenceUrls are different
          const existingUrls = existingRun.evidenceUrls || []
          const newUrls = runData.evidenceUrls || []
          const urlsChanged = existingUrls.length !== newUrls.length || 
            !existingUrls.every((url: string, i: number) => url === newUrls[i])
          
          if (urlsChanged) {
            runsToUpdate.push({
              id: existingRun.id,
              data: { evidenceUrls: runData.evidenceUrls }
            })
          }
        }
      } else {
        // Map or player will be created, so we'll need to create the run
        // Store the run data for later processing
        runsToCreate.push({
          mapName: row.mapName,
          playerHandle: playerHandle,
          type: runData.type,
          evidenceUrls: runData.evidenceUrls,
          verifiedStatus: 'VERIFIED',
        })
      }
    }
  }

  // Execute run operations
  if (runsToCreate.length > 0) {
    if (args.dryRun) {
      console.log(`Would create ${runsToCreate.length} new runs:`)
    } else {
      console.log(`Creating ${runsToCreate.length} new runs:`)
    }
    // Group runs by map for better readability
    const runsByMap = new Map<string, any[]>()
    for (const run of runsToCreate) {
      const mapName = parsedRows.find(r => mapIdByName.get(r.mapName) === run.mapId)?.mapName || 'Unknown'
      if (!runsByMap.has(mapName)) runsByMap.set(mapName, [])
      runsByMap.get(mapName)!.push(run)
    }
    
    for (const [mapName, runs] of runsByMap) {
      console.log(`      - ${mapName}: ${runs.length} runs`)
      // Show first few runs as examples
      const examples = runs.slice(0, 3)
      for (const run of examples) {
        const playerHandle = Array.from(playerIdByHandle.entries()).find(([_, id]) => id === run.playerId)?.[0] || 'Unknown'
        console.log(`        • ${playerHandle}: ${run.type}`)
      }
      if (runs.length > 3) {
        console.log(`        ... and ${runs.length - 3} more`)
      }
    }
    
    if (!args.dryRun) {
      // Separate runs with IDs from runs that need ID resolution
      const runsWithIds = runsToCreate.filter(run => 'mapId' in run)
      const runsNeedingIds = runsToCreate.filter(run => 'mapName' in run)
      
      // Process runs that already have IDs
      if (runsWithIds.length > 0) {
        const chunk = <T>(arr: T[], n: number) => {
          const out: T[][] = []
          for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
          return out
        }
        
        for (const batch of chunk(runsWithIds, 200)) {
          await prisma.run.createMany({
            data: batch,
            skipDuplicates: true,
          })
        }
      }
      
      // Process runs that need ID resolution
      if (runsNeedingIds.length > 0) {
        const resolvedRuns = runsNeedingIds.map(run => {
          const mapId = mapIdByName.get(run.mapName)
          const playerId = playerIdByHandle.get(run.playerHandle)
          
          if (!mapId) {
            throw new Error(`Map "${run.mapName}" not found for run`)
          }
          if (!playerId) {
            throw new Error(`Player "${run.playerHandle}" not found for run`)
          }
          
          return {
            mapId,
            playerId,
            type: run.type,
            evidenceUrls: run.evidenceUrls,
            verifiedStatus: run.verifiedStatus,
          }
        })
        
        const chunk = <T>(arr: T[], n: number) => {
          const out: T[][] = []
          for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
          return out
        }
        
        for (const batch of chunk(resolvedRuns, 200)) {
          await prisma.run.createMany({
            data: batch,
            skipDuplicates: true,
          })
        }
      }
    }
  }

  if (runsToUpdate.length > 0) {
    if (args.dryRun) {
      console.log(`Would update ${runsToUpdate.length} existing runs:`)
    } else {
      console.log(`Updating ${runsToUpdate.length} existing runs:`)
    }
    // Group updates by map for better readability
    const updatesByMap = new Map<string, any[]>()
    for (const update of runsToUpdate) {
      const run = existingRuns.find(r => r.id === update.id)
      if (run) {
        const mapName = run.map.name
        if (!updatesByMap.has(mapName)) updatesByMap.set(mapName, [])
        updatesByMap.get(mapName)!.push({ ...update, playerHandle: run.player.handle })
      }
    }
    
    for (const [mapName, updates] of updatesByMap) {
      console.log(`      - ${mapName}: ${updates.length} runs`)
      for (const update of updates.slice(0, 5)) { // Show first 5 as examples
        const oldUrls = existingRuns.find(r => r.id === update.id)?.evidenceUrls || []
        const newUrls = update.data.evidenceUrls || []
        console.log(`        • ${update.playerHandle}: ${oldUrls.length} → ${newUrls.length} evidence URLs`)
      }
      if (updates.length > 5) {
        console.log(`        ... and ${updates.length - 5} more`)
      }
    }
    
    if (!args.dryRun) {
      const limit = pLimit(16)
      await Promise.all(
        runsToUpdate.map(update => 
          limit(() => prisma.run.update({
            where: { id: update.id },
            data: update.data,
          }))
        )
      )
    }
  }
  if (!args.dryRun) {
    await prisma.snapshot.create({
      data: {
        sourceUrl: sourceUrl,
        sha256: contentHash,
        bytes: contentBytes,
        path: snapshotPath,
      },
    })
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  
  if (args.dryRun) {
    console.log('\nDRY RUN COMPLETE - No changes were made to the database!')
    console.log(`   Would create: ${creatorsToCreate.length} creators, ${playersToCreate.length} players, ${mapsToCreate.length} maps, ${runsToCreate.length} runs`)
    console.log(`   Would update: ${mapsToUpdate.length} maps, ${runsToUpdate.length} runs`)
    console.log(`   Analysis time: ${elapsed}s`)
    console.log('')
    console.log('To apply these changes, run the command without --dry-run')
  } else {
    console.log('\nImport complete!')
    console.log(`   Creators: ${creatorsToCreate.length} created, ${creatorIdByName.size} total`)
    console.log(`   Players: ${playersToCreate.length} created, ${playerIdByHandle.size} total`)
    console.log(`   Maps: ${mapsToCreate.length} created, ${mapsToUpdate.length} updated`)
    console.log(`   Runs: ${runsToCreate.length} created, ${runsToUpdate.length} updated`)
    console.log(`   Time: ${elapsed}s`)
  }
  console.log('')
  await prisma.$disconnect()
}

runImport().catch(error => {
  console.error('\nImport failed:')
  console.error(error)
  process.exit(1)
})
