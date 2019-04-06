const DecodePackets = packets => {
  let new_packets = [];
  packets.forEach(element => {
    new_packets.push(DecodeSinglePacket(element));
  });
  return new_packets;
};

const DecodeSinglePacket = packet => {
  let a = packet;
  let offset_packet = [];
  for (let j = 0; j < a.length / 8; j++) {
    offset_packet.push(a.substring(j * 8, (j + 1) * 8));
    offset_packet[j] = parseInt(offset_packet[j], 2);
  }
  return offset_packet;
};
const getGrpByFirstValue = (Upload_Time, grpBy) => {
  if (grpBy === 1) {
    return new Date(Upload_Time.toISOString().replace("Z", "")).getHours();
  } else if (grpBy === 2) {
    //0 - morning, 1 - afternoon, 2 - evening
    let x = new Date(Upload_Time.toISOString().replace("Z", "")).getHours();
    if (
      x === 5 ||
      x === 6 ||
      x === 7 ||
      x === 8 ||
      x === 9 ||
      x === 10 ||
      x === 11
    ) {
      return 0;
    } else if (
      x === 12 ||
      x === 13 ||
      x === 14 ||
      x === 15 ||
      x === 16 ||
      x === 17 ||
      x === 18 ||
      x === 19
    ) {
      return 1;
    } else {
      return 2;
    }
  } else if (grpBy === 4) {
    // 0 - sunday, 1 - monday ......
    return new Date(Upload_Time.toISOString().replace("Z", "")).getDay();
  } else if (grpBy === 5) {
    //0 - jan, 1 - feb .......
    return new Date(Upload_Time.toISOString().replace("Z", "")).getMonth();
  }
};
const findAvgTime = (resArr, grpBy) => {
  let numPhase;
  let parsedArr = resArr.map(e => {
    let temp = [];
    temp.push(getGrpByFirstValue(e.Upload_Time, grpBy));
    let dPackets = [];
    dPackets = DecodeSinglePacket(e.Message);
    numPhase = dPackets[5];
    dPackets = dPackets.slice(6, 6 + numPhase);
    temp.push(dPackets);
    // dPackets.forEach(e => {
    //   temp.push(e);
    // });
    return temp;
  });
  let n;
  if (grpBy === 5) {
    n = 12;
  } else if (grpBy === 4) {
    n = 7;
  } else if (grpBy === 2) {
    n = 3;
  } else if (grpBy === 1) {
    n = 24;
  }
  let length = new Array(n).fill(0);
  let res = new Array(n).fill(0);
  res = res.map(e => {
    return new Array(numPhase).fill(0);
  });
  parsedArr.forEach(e => {
    length[e[0]] += 1;
    res[e[0]] = res[e[0]].map((l, index) => {
      return (l = l + e[1][index]);
    });
  });
  res = res.map((e, index) => {
    return e.map(l => {
      return Math.round(l / length[index]);
    });
  });
  return res;
};

const findDensity = packets => {
  dPackets = DecodePackets(packets);
  let density = 0;
  dPackets.forEach(e => {
    density = density + e[4];
  });
  density = density / dPackets.length;
  return Math.round(density / 2.55);
};


module.exports = {
  findDensity,
  findAvgTime
};
