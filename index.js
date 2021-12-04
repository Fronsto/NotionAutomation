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


(async () => {
  const blockId = block_id;
  const response = await notion.blocks.update({
    block_id: blockId,
    paragraph: {
      text: [{
        type: "text",
        text: {
          content: "Lacinato kale"
        }
      }],
      
    }
  });
  console.log(response);
})();

app.listen(3000 || process.env.PORT, () => {
    console.log("Server is up and running");
});