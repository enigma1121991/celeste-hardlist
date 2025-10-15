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
import { getRunDate } from '../lib/retrieve-date'

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
    console.error('  --dry-run    Show what would be changed without modifying the database or filesystem')
    process.exit(1)
  }
  return { csv, sheet, sheetName, snapshotsDir, dryRun }
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

function arraysEqualUnordered(a: string[] | null | undefined, b: string[] | null | undefined): boolean {
  const aa = Array.isArray(a) ? [...a].sort() : []
  const bb = Array.isArray(b) ? [...b].sort() : []
  if (aa.length !== bb.length) return false
  for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false
  return true
}

async function runImport() {
  const startTime = Date.now()
  const args = parseArgs()
  const { csv: csvSource, sheet: sheetSource, sheetName, snapshotsDir, dryRun } = args
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

  const existingSnapshot = await prisma.snapshot.findUnique({
    where: { sha256: contentHash },
  })

  if (existingSnapshot && !dryRun) {
    console.log('\nSheet content is unchanged. Proceeding with data sync anyway.')
    // console.log('\nImport aborted: The sheet data has not changed since the last import.')
    // console.log(`   Matching snapshot was captured at: ${existingSnapshot.capturedAt.toISOString()}`)
    // await prisma.$disconnect()
    // process.exit(0)
  }

  if (!dryRun) {
  await mkdir(snapshotsDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const snapshotPath = join(snapshotsDir, `${timestamp}.csv`)
  await writeFile(snapshotPath, content, 'utf-8')
    console.log(`Saved snapshot: ${snapshotPath}`)
  } else {
    console.log('Dry run: skipping snapshot file write')
  }
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
  if (parsedRows.length > 0) parsedRows.pop(); // # challenges or something
  console.log(`   Parsed ${parsedRows.length} valid map rows`)
  console.log('')
  console.log(dryRun ? 'DRY RUN - Analyzing differences (no changes will be made)...' : 'Analyzing differences with database...')
  const uniqueCreators = new Set<string>()
  const uniquePlayers = new Set<string>()
  const mapNames = new Set<string>()
  for (const row of parsedRows) {
    uniqueCreators.add(row.creatorName)
    mapNames.add(row.mapName)
    Object.keys(row.playerData).forEach(p => uniquePlayers.add(p))
  }
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
        canonicalVideoUrl: true,
      },
    }),
    prisma.run.findMany({
      where: {
        map: { name: { in: [...mapNames] } },
        player: { handle: { in: [...uniquePlayers] } },
      },
      select: {
        id: true,
        mapId: true,
        playerId: true,
        type: true,
        evidenceUrls: true,
        verifiedStatus: true,
        map: { select: { name: true } },
        player: { select: { handle: true } },
      },
    }),
  ])
  const creatorIdByName = new Map(existingCreators.map(r => [r.name, r.id]))
  const playerIdByHandle = new Map(existingPlayers.map(r => [r.handle, r.id]))
  const mapIdByName = new Map(existingMaps.map(m => [m.name, m.id]))
  const existingMapByName = new Map(existingMaps.map(m => [m.name, m]))
  const creatorsToCreate: string[] = []
  const playersToCreate: string[] = []
  const mapsToCreate: any[] = []
  const mapsToUpdate: { id: string; data: any }[] = []
  for (const creatorName of uniqueCreators) {
    if (!creatorIdByName.has(creatorName)) creatorsToCreate.push(creatorName)
  }
  for (const playerHandle of uniquePlayers) {
    if (!playerIdByHandle.has(playerHandle)) playersToCreate.push(playerHandle)
  }
  for (const row of parsedRows) {
    const existingMap = existingMapByName.get(row.mapName)
    const gm = row.stars ? getGMFromStars(row.stars) : null
    if (!existingMap) {
      const creatorExists = creatorIdByName.has(row.creatorName)
      const creatorWillBeCreated = creatorsToCreate.includes(row.creatorName)
      if (creatorExists || creatorWillBeCreated) {
      const slug = await generateUniqueSlug(row.mapName)
      mapsToCreate.push({
        name: row.mapName,
        slug,
          creatorId: creatorExists ? creatorIdByName.get(row.creatorName) : null,
          creatorName: row.creatorName,
        stars: row.stars,
        gmColor: gm?.color ?? null,
        gmTier: gm?.tier ?? null,
        canonicalVideoUrl: row.canonicalVideoUrl,
      })
    }
    } else {
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
          },
        })
      }
    }
  }
  if (creatorsToCreate.length > 0) {
    console.log(dryRun ? `Would create ${creatorsToCreate.length} new creators:` : `Creating ${creatorsToCreate.length} new creators:`)
    creatorsToCreate.forEach(name => console.log(`      - ${name}`))
    if (!dryRun) {
      await prisma.creatorProfile.createMany({ data: creatorsToCreate.map(name => ({ name })), skipDuplicates: true })
      const newCreators = await prisma.creatorProfile.findMany({ where: { name: { in: creatorsToCreate } }, select: { id: true, name: true } })
      newCreators.forEach(c => creatorIdByName.set(c.name, c.id))
    }
  }
  if (playersToCreate.length > 0) {
    console.log(dryRun ? `Would create ${playersToCreate.length} new players:` : `Creating ${playersToCreate.length} new players:`)
    playersToCreate.forEach(handle => console.log(`      - ${handle}`))
    if (!dryRun) {
      await prisma.player.createMany({ data: playersToCreate.map(handle => ({ handle })), skipDuplicates: true })
      const newPlayers = await prisma.player.findMany({ where: { handle: { in: playersToCreate } }, select: { id: true, handle: true } })
      newPlayers.forEach(p => playerIdByHandle.set(p.handle, p.id))
    }
  }
  if (mapsToCreate.length > 0) {
    console.log(dryRun ? `Would create ${mapsToCreate.length} new maps:` : `Creating ${mapsToCreate.length} new maps:`)
    mapsToCreate.forEach(map => console.log(`      - ${map.name} (${map.stars}⭐)`))
    if (!dryRun) {
      const mapsWithResolvedCreators = mapsToCreate.map(map => {
        if (map.creatorId === null && map.creatorName) {
          const resolvedCreatorId = creatorIdByName.get(map.creatorName)
          if (!resolvedCreatorId) throw new Error(`Creator "${map.creatorName}" not found for map "${map.name}"`)
          return { ...map, creatorId: resolvedCreatorId }
        }
        return map
      })
      await prisma.map.createMany({ data: mapsWithResolvedCreators.map(({ creatorName, ...map }) => map), skipDuplicates: true })
      const newMaps = await prisma.map.findMany({ where: { name: { in: mapsToCreate.map(m => m.name) } }, select: { id: true, name: true } })
      newMaps.forEach(m => mapIdByName.set(m.name, m.id))
    }
  }
  if (mapsToUpdate.length > 0) {
    console.log(dryRun ? `Would update ${mapsToUpdate.length} existing maps:` : `Updating ${mapsToUpdate.length} existing maps:`)
    for (const update of mapsToUpdate) {
      const map = existingMaps.find(m => m.id === update.id)
      const changes = []
      if (map?.stars !== update.data.stars) changes.push(`stars: ${map?.stars} -> ${update.data.stars}`)
      if (map?.gmColor !== update.data.gmColor) changes.push(`gmColor: ${map?.gmColor} -> ${update.data.gmColor}`)
      if (map?.gmTier !== update.data.gmTier) changes.push(`gmTier: ${map?.gmTier} -> ${update.data.gmTier}`)
      if (map?.canonicalVideoUrl !== update.data.canonicalVideoUrl) changes.push(`video: ${map?.canonicalVideoUrl || 'none'} → ${update.data.canonicalVideoUrl || 'none'}`)
      console.log(`      - ${map?.name}: ${changes.join(', ')}`)
    }
    if (!dryRun) {
      const limit = pLimit(16)
      await Promise.all(mapsToUpdate.map(update => limit(() => prisma.map.update({ where: { id: update.id }, data: update.data }))))
    }
  }
  console.log('   Analyzing runs...')
  const desiredByPair: Map<string, { mapName: string; playerHandle: string; type: string; evidenceUrls: string[] | null; verifiedStatus: string, createdAt: Date }> = new Map()
  for (const row of parsedRows) {
    for (const [playerHandle, cellValue] of Object.entries(row.playerData)) {
      const runData = mapCellToRunType(cellValue)
      if (!runData) continue
      desiredByPair.set(`${row.mapName}|||${playerHandle}`, {
        mapName: row.mapName,
        playerHandle,
        type: runData.type,
        evidenceUrls: runData.evidenceUrls ?? null,
        verifiedStatus: 'VERIFIED',
        createdAt: new Date(0),
      })
    }
  }
  const runIndex = new Map<string, { rows: typeof existingRuns; items: typeof existingRuns }>()
  for (const r of existingRuns) {
    const key = `${r.map.name}|||${r.player.handle}`
    if (!runIndex.has(key)) runIndex.set(key, { rows: [], items: [] } as any)
    ;(runIndex.get(key)!.items as any).push(r)
  }
  const toCreate: Array<{ mapId: string; playerId: string; type: string; evidenceUrls: string[] | null; verifiedStatus: string; createdAt: Date}> = []
  const toReplace: Array<{
    key: string
    deleteCount: number
    create: { mapId: string; playerId: string; type: string; evidenceUrls: string[] | null; verifiedStatus: string }
  }> = []
  const unresolvedPairs: Array<{ mapName: string; playerHandle: string; reason: string }> = []
  for (const [key, desired] of desiredByPair.entries()) {
    const { mapName, playerHandle, type, evidenceUrls, verifiedStatus } = desired
    const mapId = mapIdByName.get(mapName)
    const playerId = playerIdByHandle.get(playerHandle)
    if (!mapId || !playerId) {
      unresolvedPairs.push({ mapName, playerHandle, reason: !mapId ? 'map not found' : 'player not found' })
      continue
    }
    const existingForPair = runIndex.get(key)?.items ?? []
    var epochDate = new Date(0);
    if (evidenceUrls) {
        // epochDate = await getRunDate(evidenceUrls[0] || "")
        epochDate = new Date(0)
    }
    if (existingForPair.length === 0) {
      toCreate.push({ mapId, playerId, type, evidenceUrls, verifiedStatus, createdAt: epochDate })
      continue
    }
    const exactlyOne = existingForPair.length === 1
    const sameType = exactlyOne ? existingForPair[0].type === type : false
    const sameEvidence = exactlyOne ? arraysEqualUnordered(existingForPair[0].evidenceUrls as any, evidenceUrls as any) : false
    const sameStatus = exactlyOne ? (existingForPair[0].verifiedStatus || 'VERIFIED') === verifiedStatus : false
    const matches = exactlyOne && sameType && sameEvidence && sameStatus
    if (!matches) {
      toReplace.push({
        key,
        deleteCount: existingForPair.length,
        create: { mapId, playerId, type, evidenceUrls, verifiedStatus },
      })
    }
  }
  if (unresolvedPairs.length > 0) {
    console.log('   Some sheet pairs reference maps/players that do not yet exist:')
    unresolvedPairs.forEach(p => console.log(`      - ${p.mapName} / ${p.playerHandle} (${p.reason})`))
    if (!dryRun) {
      if (playersToCreate.length > 0 || mapsToCreate.length > 0) {
        const newlyPlayers = await prisma.player.findMany({ where: { handle: { in: playersToCreate } }, select: { id: true, handle: true } })
        newlyPlayers.forEach(p => playerIdByHandle.set(p.handle, p.id))
        const newlyMaps = await prisma.map.findMany({ where: { name: { in: mapsToCreate.map(m => m.name) } }, select: { id: true, name: true } })
        newlyMaps.forEach(m => mapIdByName.set(m.name, m.id))
        const stillUnresolved: string[] = []
        for (const u of unresolvedPairs) {
          const mapId = mapIdByName.get(u.mapName)
          const playerId = playerIdByHandle.get(u.playerHandle)
          if (!mapId || !playerId) stillUnresolved.push(`${u.mapName} / ${u.playerHandle}`)
          else {
            const desired = desiredByPair.get(`${u.mapName}|||${u.playerHandle}`)!
            const existingForPair = runIndex.get(`${u.mapName}|||${u.playerHandle}`)?.items ?? []
            if (existingForPair.length === 0) {
              toCreate.push({ mapId, playerId, type: desired.type, evidenceUrls: desired.evidenceUrls, verifiedStatus: desired.verifiedStatus, createdAt: desired.createdAt })
            } else {
              toReplace.push({
                key: `${u.mapName}|||${u.playerHandle}`,
                deleteCount: existingForPair.length,
                create: { mapId, playerId, type: desired.type, evidenceUrls: desired.evidenceUrls, verifiedStatus: desired.verifiedStatus },
              })
            }
          }
        }
        if (stillUnresolved.length > 0) console.log(`   Still unresolved after creates: ${stillUnresolved.length}`)
      }
    }
  }
  if (dryRun) {
    console.log(`\nDRY RUN CHANGES`)
    if (mapsToUpdate.length > 0) console.log(`   Update maps: ${mapsToUpdate.length}`)
    console.log(`   Create runs: ${toCreate.length}`)
    toCreate.slice(0, 10).forEach(c => {
      const mapName = Array.from(mapIdByName.entries()).find(([k, v]) => v === c.mapId)?.[0] || c.mapId
      const playerHandle = Array.from(playerIdByHandle.entries()).find(([k, v]) => v === c.playerId)?.[0] || c.playerId
      console.log(`      + ${mapName} / ${playerHandle} -> ${c.type}`)
    })
    if (toCreate.length > 10) console.log(`      ... and ${toCreate.length - 10} more`)
    console.log(`   Replace runs (delete all existing for pair, then create 1): ${toReplace.length}`)
    toReplace.slice(0, 10).forEach(r => {
      const mapName = Array.from(mapIdByName.entries()).find(([k, v]) => v === r.create.mapId)?.[0] || r.create.mapId
      const playerHandle = Array.from(playerIdByHandle.entries()).find(([k, v]) => v === r.create.playerId)?.[0] || r.create.playerId
      console.log(`      ~ ${mapName} / ${playerHandle}: delete ${r.deleteCount}, create ${r.create.type}`)
    })
    if (toReplace.length > 10) console.log(`      ... and ${toReplace.length - 10} more`)
  } else {
    if (mapsToUpdate.length > 0) {
      console.log('')
    }
    console.log(`\nApplying run changes...`)
  const chunk = <T>(arr: T[], n: number) => {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
    return out
  }
    for (const rep of toReplace) {
      await prisma.run.deleteMany({ where: { mapId: rep.create.mapId, playerId: rep.create.playerId } })
      await prisma.run.create({
        data: {
          mapId: rep.create.mapId,
          playerId: rep.create.playerId,
          type: rep.create.type,
          evidenceUrls: rep.create.evidenceUrls,
          verifiedStatus: rep.create.verifiedStatus,
        },
      })
    }
    for (const batch of chunk(toCreate, 200)) {
      await prisma.run.createMany({ data: batch, skipDuplicates: true })
    }
  }
  if (!dryRun && !existingSnapshot) {
  await prisma.snapshot.create({
    data: {
      sourceUrl: sourceUrl,
      sha256: contentHash,
      bytes: contentBytes,
        path: '',
    },
  })
  } else if (dryRun) {
    console.log('\nDry run: skipping snapshot row insert')
  } else {
    console.log('\nSkipping snapshot row insert because content is unchanged.')
  }
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  if (dryRun) {
    console.log('\nDRY RUN COMPLETE - No changes were made to the database or filesystem!')
    console.log(`   Would create: ${creatorsToCreate.length} creators, ${playersToCreate.length} players, ${mapsToCreate.length} maps, ${toCreate.length + toReplace.length} runs`)
    console.log(`   Would update: ${mapsToUpdate.length} maps`)
    console.log(`   Would replace runs for: ${toReplace.length} player/map combinations`)
    console.log(`   Analysis time: ${elapsed}s`)
    console.log('')
    console.log('To apply these changes, run the command without --dry-run')
  } else {
    console.log('\nImport complete!')
    console.log(`   Creators: ${creatorsToCreate.length} created, ${creatorIdByName.size} total`)
    console.log(`   Players: ${playersToCreate.length} created, ${playerIdByHandle.size} total`)
    console.log(`   Maps: ${mapsToCreate.length} created, ${mapsToUpdate.length} updated`)
    console.log(`   Runs: ${toCreate.length} created, ${toReplace.length} replaced`)
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
