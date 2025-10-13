export const getStarColor = (stars: number): string => {
    const colorMap: Record<number, string> = {
        10: "#8E6EEA",
        9: "#4058FC",
        8: "#83FFE9",
        7: "#32FFA0",
        6: "#32FF32",
        5: "#FFFF32",
        4: "#ff5435",
        3: "#fe496a",
        2: "#ff39d2",
        1: "#9900ff",
        0: "#fff",
        '-1': "#a29ffe",
        '-2': "#8d6eea",
    };
    return colorMap[stars] || "#71717a";
};

export const getTagColor = (tag: string): string => {
    const tagColors: { [key: string]: string } = {
        "LPL": "#e69138",
        "SSC2024": "#97d7ff",
        "SJ": "#ff3434",
        "AC": "#3fa82a",
        "5BFierV": "#ff96f1",
        "NSSSC": "#77db41",
        "Spring Collab 2020": "#77db41",
        "NC": "#b7b7b7",
        "IC": "#C24860",
        "SFFC25": "#00FFFF",
        "TCH": "#F1C856",
        "PDBC24": "#42EB12",
        "ET": "#00B199",
        "AWWPD": "#EEB4EA",
        "SC21": "#C988BB",
        "P2P": "#b4a7d6",
        "LDSS": "#97d7fe",
        "BUF": "#94be40",
        "CC": "#bdbdbd",
        "SJS": "#ff3434",
    };
    return tagColors[tag] || "#FFF"
}

export const getGmColorClass = (color: string | null) => {
    if (!color) return "bg-gray-500";
    if (color === "GREEN") return "bg-[#16a34a]";
    if (color === "YELLOW") return "bg-[#ca8a04]";
    if (color === "RED") return "bg-[#dc2626]";
    return "bg-gray-500";
};

// export default function FormatMapName(name: string) {
//   const tagMap: Record<string, string> = {
//     'IC': "#c24860",
//     'LDSS': "#97d7fe",
//     'LPL': "#e69138",

//   }

//   return (
//     <span>{name}</span>
//   );
// };