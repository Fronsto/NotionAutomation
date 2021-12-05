const dotenv = require('dotenv').config();
const {Client} = require('@notionhq/client');
const { response } = require('express');

const express = require('express');
const app = express();

const fetch = require('node-fetch');

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static("public"));

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

const db_id=process.env.NOTION_DB_ID;

let now=new Date();
now=`${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}T${now.getUTCHours()}%3A00`
let tomorrow=new Date();
tomorrow.setDate(tomorrow.getDate()+2);
tomorrow=`${tomorrow.getUTCFullYear()}-${tomorrow.getUTCMonth()+1}-${tomorrow.getUTCDate()}T${tomorrow.getUTCHours()}%3A00`

getFutureContests = async () => {
    try{
        const url= `https://clist.by/api/v2/contest/?username=${process.env.CLIST_USER}&api_key=${process.env.CLIST_API_KEY}&start__gt=${now}&end__lt=${tomorrow}`;
        const res = await fetch(url).then(res => res.json());
        return res.objects;
    }
    catch(err){
        return err.message;
    }
}

async function addItem(obj) {
  try{
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

precheck = async () => {
    try{

    const result = await notion.databases.query({
        database_id: db_id,
    });
    let id_array =[]
    result.results.forEach((pg)=>{
        obj_time = new Date(pg.properties.Time.rich_text[0].text.content);
        curr_time = new Date();
        if(obj_time<curr_time){
            notion.pages.update({
                page_id: pg.id,
                archived: true
            })
            console.log("removed this page")
            console.log(pg.properties.Name.title[0].text.content)
        } else {
            id_array.push(pg.properties.contest_id.number);
        }
    })
    return id_array ;
    }
    catch (err){
        return [-1, err.message];
    }

}

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

main = async () => {
    const liste = await getFutureContests();
    const result = await updateNotion(liste);
    console.log(result);
};

app.get("/api", async function(req, res){
    try{
        const respone = await notion.databases.query({
            database_id: db_id,
        });
        res.send(respone);
    }
    catch(err){
        return err;
    }
});

app.listen(3000 || process.env.PORT, () => {
    console.log("Server is up and running");
    main();
});