import { youtubeToTimestamp } from './youtube-date.ts'
import { getBilibiliTimestamp } from './bilibili-date.ts'
import { discordToTimestamp } from './discord-date.ts'
import { getCatboxLastModified } from './catbox-date.ts'

export async function getRunDate(date: string) {
    if (date.includes("youtu")) {
        var youtubeDate = await youtubeToTimestamp(date)
        if (typeof youtubeDate === "object") {
            console.log(`YOUTUBE DATE RETRIEVAL ERROR: ${youtubeDate['error']}`)
            return new Date(0)
        }
        return new Date(youtubeDate)
    } 
    else if (date.includes("bilibili") || date.includes("b23.tv")) { 
        await new Promise(resolve => setTimeout(resolve, 5000)); // bilibili fucking SUCKS dude
        const bilibiliDate = await getBilibiliTimestamp(date)
        if (bilibiliDate && typeof bilibiliDate === "object" && 'error' in bilibiliDate) {
            console.log(`BILIBILI DATE RETRIEVAL ERROR: ${bilibiliDate['error']}`)
            return new Date(0)
        }
        return new Date(bilibiliDate as string)
    } 
    else if (date.includes("discord")) {
        var discordDate = discordToTimestamp(date)
        if (typeof discordDate === "object") {
            console.log(`DISCORD DATE RETRIEVAL ERROR: ${discordDate['error']}`)
            return new Date(0)
        }
        return new Date(discordDate)
    } else if (date.includes("catbox")) {
        var catboxDate = await getCatboxLastModified(date)
        if (typeof catboxDate === "object") {
            console.log(`DISCORD DATE RETRIEVAL ERROR: ${catboxDate['error']}`)
            return new Date(0)
        }
        return new Date(catboxDate) 
    }

    return new Date(0);
}

// getRunDate("https://www.bilibili.com/video/BV13Y411Q7NH/?buvid=XYE527FE95CC8176A5D93F686A62083468EE9&is_story_h5=false&p=1&plat_id=116&up_id=44225754").then(console.log)
// getRunDate("https://files.catbox.moe/5pdbs2.png").then(console.log)
// getRunDate("https://youtu.be/K4PDMUrnDWE").then(console.log)
// getRunDate("https://media.discordapp.net/attachments/1251557318462799872/1427284838351896606/image0.jpg?ex=68ee4e17&is=68ecfc97&hm=3c2682551bae074343ec2d3469bad15cebee70c39dcb37247e32b16857b9782e&=&format=webp&width=595&height=1257").then(console.log)