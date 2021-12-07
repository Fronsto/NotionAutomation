# Notion auto-updated with Upcoming Coding Contests

This program uses Notion's (the productivity software) API, and Clist.by's API to get a list of upcoming coding contests and automatically adds them in Notion's database. 
To use it, create a .env file in the folder and add 4 env variables: `NOTION_TOKEN` (notion's secret api token), `NOTION_DB_ID` , `CLIST_USER` (your clist.by's username), and `CLIST_API_KEY`.
The notion database where you'd get the list of contests, must have these 5 columns: `Name`, `LocalTime` (type:text), `Host` (type: single select), `Link` (type:url), `Time` (type:text) and `contest_id` (type:number).  


