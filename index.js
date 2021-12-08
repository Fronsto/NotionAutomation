// Dependencies:
const {Client} = require('@notionhq/client');
const fetch = require('node-fetch');
//////////////////////////////////////////
// Creating the Notion client:
const notion = new Client({
    auth: process.env.NOTION_TOKEN,
    notionVersion: "2021-08-16"
});

const db_id=process.env.NOTION_DB_ID;
//////////////////////////////////////////

// For getting the contest list, we first create the strings containing dates for now and 2 days later
let now=new Date();
now=`${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}T${now.getUTCHours()}%3A${now.getUTCMinutes()}`
let tomorrow=new Date();
tomorrow.setDate(tomorrow.getDate()+2);
tomorrow=`${tomorrow.getUTCFullYear()}-${tomorrow.getUTCMonth()+1}-${tomorrow.getUTCDate()}T${tomorrow.getUTCHours()}%3A${tomorrow.getUTCMinutes()}`

// Calls clist's API
getFutureContests = async () => {
    try{
        const url= `https://clist.by/api/v2/contest/?username=${process.env.CLIST_USER}&api_key=${process.env.CLIST_API_KEY}&start__gt=${now}&end__lt=${tomorrow}`;
        const res = await fetch(url).then(res => res.json());
        return res.objects;
    }
    catch(err){
        console.log(err.message);
    }
}

////////////////////////////////////////
// Given an object obj, this calls notion's API and add it to DB.
async function addItem(obj) {
  try{
    let ftime=new Date(obj.start+'Z');
    const response = await notion.pages.create({
        parent: { database_id: db_id },
        properties: {
            'Name': {
                type: 'title',
                title: [
                {
                    type: 'text',
                    text: {
                        content: obj.event,
                    },
                },
                ],
            },
            'Time': {
                type: 'rich_text',
                rich_text: [
                {
                    type: 'text',
                    text: {
                        content: obj.start,
                    },
                },
                ],
            },
            'LocalTime': {
                type: 'rich_text',
                rich_text: [
                {
                    type: 'text',
                    text: {
                        content: `${ftime.toLocaleString()}`,
                    },
                },
                ],
            },
            'contest_id': {
                type: 'number',
                number: obj.id
            },
            'Link':{
                type: 'url',
                url: obj.href
            },
            'Host':{
                type: 'select',
                select: {
                    name: obj.host,
                },
            },
        },
    })
    console.log("Success! Entry added.")
  } catch (error) {
    console.error(error.body)
  }
}

// Removes outdated entries, and get list of contest ids of those in DB, so as to prevent redundancy
precheck = async () => {
    try{

    const result = await notion.databases.query({
        database_id: db_id,
    });
    let id_array =[];
    curr_time = new Date();
    result.results.forEach(
        async (pg)=>{
        try{
            obj_time = new Date(pg.properties.Time.rich_text[0].text.content+'Z');
            if(obj_time<curr_time){
                console.log("removed this page");
                console.log(pg.properties.Name.title[0].text.content);
                const response = await notion.pages.update({
                    page_id: pg.id,
                    archived: true,
                });
                console.log(response);
            } else {
                id_array.push(pg.properties.contest_id.number);
            }
        } catch(err){
            console.log(err)
        } 
    })
    return id_array ;
    }
    catch (err){
        return [-1, err.message];
    }

}

// @param: the object recieved from clist API
// first call precheck, then adds contests not already present in DB.
updateNotion =async (liste) => {
    try{
        const id_list= await precheck();
        if(id_list[0] === -1){
            return id_list[1];
        }
        for(const obj of liste){
            if(! id_list.includes(obj.id)) {
                const stat = await addItem(obj);
                console.log("following obj added!")
                console.log(obj.id)
            }
            else{
                console.log("already in db!")
                console.log(obj.id)
            }
        }

        return "done";
    }
    catch(err){
        return err.message;
    }
}

// Starts the execution:

main = async () => {
    const liste = await getFutureContests();
    const result = await updateNotion(liste);
    console.log(result);
};

// Implementing chrome alarms to call main periodically:

chrome.runtime.onInstalled.addListener(() => {
  console.log('onInstalled....');
  scheduleRequest();
  scheduleWatchdog();
  main();
});

// fetch and save data when chrome restarted, alarm will continue running when chrome is restarted
chrome.runtime.onStartup.addListener(() => {
  console.log('onStartup....');
  main();
});

// alarm listener
chrome.alarms.onAlarm.addListener(alarm => {
  // if watchdog is triggered, check whether refresh alarm is there
  if (alarm && alarm.name === 'watchdog') {
    chrome.alarms.get('refresh', alarm => {
      if (alarm) {
        console.log('Refresh alarm exists. Yay.');
      } else {
        // if it is not there, start a new request and reschedule refresh alarm
        console.log("Refresh alarm doesn't exist, starting a new one");
        main();
        scheduleRequest();
      }
    });
  } else {
    // if refresh alarm triggered, start a new request
    main();
  }
});

// schedule a new fetch every 30 minutes
function scheduleRequest() {
  console.log('schedule refresh alarm to 30 minutes...');
  chrome.alarms.create('refresh', { periodInMinutes: 60 });
}

// schedule a watchdog check every 5 minutes
function scheduleWatchdog() {
  console.log('schedule watchdog alarm to 5 minutes...');
  chrome.alarms.create('watchdog', { periodInMinutes: 10 });
}
