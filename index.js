const dotenv = require('dotenv').config();
const {Client} = require('@notionhq/client');

const express = require('express');
const app = express();

const fetch = require('node-fetch');

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static("public"));

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

const block_id=process.env.NOTION_BLOCK_ID;
const db_id=process.env.NOTION_DB_ID;

let now=new Date();
now=`${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}T${now.getUTCHours()}%3A00`
let tomorrow=new Date();
tomorrow.setDate(tomorrow.getDate()+1);
tomorrow=`${tomorrow.getUTCFullYear()}-${tomorrow.getUTCMonth()+1}-${tomorrow.getUTCDate()}T${tomorrow.getUTCHours()}%3A00`

getFutureContests = async () => {
    try{
        let url= `https://clist.by/api/v2/contest/?username=${process.env.CLIST_USER}&api_key=${process.env.CLIST_API_KEY}`
        url+= `&start__gt=${now}&end__lt=${tomorrow}`;
        const res = await fetch(url).then(res => res.json());
        
        console.log(res.objects[0]);

        return res.objects[1].host;
    }
    catch(err){
        return err.message;
    }
}
updateNotion =async (liste) => {
    try{
        const blockId = block_id;
        const response = await notion.blocks.update({
            block_id: blockId,
            paragraph: {
                text: [{
                    type: "text",
                    text: {
                        content: liste
                    }   
                }],
            }
        });
        return "success"
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


app.listen(3000 || process.env.PORT, () => {
    console.log("Server is up and running");
    main();
});