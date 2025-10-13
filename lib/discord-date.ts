export function discordToTimestamp(url: string) {
    const match = url.match(/\d{17,19}/g);
    if (!match || !match[1]) return { error: 'couldnt find message id' };

    // 1420070400000 = Discord Epoch
    return (new Date(Number((BigInt(match[1]) >> BigInt(22)) + BigInt(1420070400000)))).toISOString();
}

// console.log(discordToTimestamp("https://cdn.discordapp.com/attachments/848310518883942463/1426677602877309069/GoL3wx-bkAAbBHy.png?ex=68ec188e&is=68eac70e&hm=e494e36928223b3187a2f7d23116f8bfea457e9ebae18a718c2df6cc4297925d&"))