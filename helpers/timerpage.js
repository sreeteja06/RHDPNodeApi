const timerpageApi = ( packets, date_time ) => {
    let start = new Date().getTime();
    let details_dict = {}
    let new_packets = create_timer(packets);
    let laststage = [];
    for(let i = 0; i<new_packets.length;i++){
        laststage.push(new_packets[i][new_packets[i].length - 6]);
    }
    console.log("last stage:"+laststage);
    laststage.pop();
    laststage.push(0);
    let implementTime = [];
    for(let i = 0; i < laststage.length; i++){
        let laststageTime = new Date(laststage[i]*1000);
        let tTime = new Date(date_time[i].getTime() + laststageTime.getTime());
        implementTime.push( tTime );
    }
    console.log("implement time:"+implementTime);
    let timeLeft, timeAllocated;
    const reValue = findTimeLeft(implementTime, new_packets);
    timeLeft = reValue.timeLeft;
    timeAllocated = reValue.timeAllocated;
    details_dict["pedTime"] = 0
    details_dict["trafficPercent"] = Math.round(timeAllocated.reduce((a,b)=>a+b, 0)/2.55)
    const numPhase = new_packets[0][5]
    let details_list = new Array(new_packets.length).fill({});
    for(let i = 0; i< numPhase;i++){
        road_dict = {}                               //this is the object for every stage
        road_dict['stageName'] = 'Stage ' + (i + 1).toString()
        road_dict['timeAllocated'] = timeAllocated[i]
        road_dict['timeleft'] = timeLeft[i]
        road_dict['amberTime'] = 5
        details_list[i] = road_dict
    }

    details_dict["stagesInfo"] = details_list;
    details_dict["systime"] = new Date().getTime();
    console.log("time Taken overall(in seconds):"+ (details_dict["systime"]-start)/1000);
    return details_dict;
};

const create_timer = packets => {
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

const checkLeft = (packet, difference) => {
  let timeLeft = new Array(packet.length).fill(0);
  for (let i = 0; i < timeLeft.length; i++) {
    let j = packet[i];
    let k = difference - j; 
    if (k > 0) {
      timeLeft[i] = 0;
      difference = k;
    } else {
      timeLeft[i] = parseInt(-k);
      difference = 0;
    }
  }
  return timeLeft;
};

const findTimeLeft = (packetList, packets) => {
  let inTime = new Date();
  let timeAllocated, timeLeft;
  for (let i = 1; i >= 0; i--) {
    let numPhase = packets[i][5];
    if (inTime > packetList[i]) {
      diff = new Date(inTime.getTime() - packetList[i].getTime()).getSeconds();
      if (-1 <= diff <= 1) {
        asyncSleep(2);
        inTime = new Date();
        diff = new Date(
          inTime.getTime() - packetList[i].getTime()
        ).getSeconds();
      }
      timeAllocated = packets[i].slice(6, 6 + numPhase);
      timeLeft = checkLeft(timeAllocated, diff);
    } else {
      console.log("continue");
      timeAllocated = packets[i].slice(6, 6 + numPhase);
      timeLeft = timeAllocated;
    }
  }
  return { timeLeft, timeAllocated };
};

const sleep = s => new Promise(resolve => setTimeout(resolve, s * 1000));
const asyncSleep = async s => {
  await sleep(s);
}; 

module.exports = {
    timer : timerpageApi
}