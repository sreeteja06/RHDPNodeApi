const DecodePackets = packets => {
    let new_packets = [];
    packets.forEach(element => {
        let a = element;
        let offset_packet = [];
        for (let j = 0; j < a.length / 8; j++) {
            offset_packet.push(a.substring(j * 8, (j + 1) * 8));
            offset_packet[j] = parseInt(offset_packet[j], 2);
        }
        new_packets.push(offset_packet);
    });
    return new_packets;
};

const findDensity = packets => {
    dPackets = DecodePackets(packets);
    let density = 0;
    dPackets.forEach(e => {
        density = density + e[4];
    })
    density = density / dPackets.length;
    return Math.round(density / 2.55);
}

const findAvgTime = packets => {
    dPackets = DecodePackets(packets);
    let avgStageTime = new Array(dPackets[0][5]).fill(0);
    dPackets.forEach(e => {
        let n = e[5];
        for (let i = 6, j = 0; i <= n + 5; i++ , j++) {
            avgStageTime[j] += e[i];
        }
    });
    avgStageTime = avgStageTime.map(e => Math.round(e / dPackets.length));
    return avgStageTime;
}

module.exports = {
    findDensity,
    findAvgTime
}