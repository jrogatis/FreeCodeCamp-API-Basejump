const express = require('express');
const router = express.Router();
const pg = require('pg');
const request = require('request');
const dotenv = require('dotenv');
const google = require('googleapis');
const customsearch = google.customsearch('v1');

// You can get a custom search engine id at
// https://www.google.com/cse/create/new
const CX = 'INSERT YOUR CUSTOM SEARCH ENGINE ID here';
const API_KEY = 'INSERT YOUR API KEY HERE';
const SEARCH = 'INSERT A GOOGLE REQUEST HERE';

const DATABASE_URL = 'postgres://fidbvttodbpssc:ygSkoG5ECKgTGVI_iTlB-MD2rQ@ec2-54-243-28-22.compute-1.amazonaws.com:5432/d6vqln1g3antb3';




pg.defaults.ssl = true;

console.log(process.env.CSE_API_KEY)
pg.connect(DATABASE_URL, (err, client) => {
    if (err) throw err;
    console.log('Connected to postgres! Getting tables...');

    router.get('/', (req, res) =>{
      res.render('index', { title: 'Express' });

    });

    router.get('/api/imagesearch/:query/:page?', (req,res)=>{
            console.log(req.params.query);
            const searchQuery = req.params.query.split(' ').join('+');
            //const page = (typeof req.params.page !== 'undefined') ? parseInt(req.params.page) : 0;
            //let offset =  page * 10;
            //offset = offset > 0 ? offset + 1 : offset;
            //const startAt = (offset > 0) ? "&start=" + offset : "";


         /*let urlToQuery = `https://www.googleapis.com/customsearch/v1?`
                urlToQuery +=   `searchType=image`
                urlToQuery +=   `${startAt}`;
                urlToQuery +=   `&num=10`;
                urlToQuery +=   `&q=${searchQuery}`;
                urlToQuery +=   `&cx=${process.env.CSE_ID}`;
                urlToQuery +=   `&key=${process.env.CSE_API_KEY}`;
            console.log(urlToQuery);   */
            console.log(process.env.CSE_ID);
            customsearch.cse.list({ cx: process.env.CSE_ID, q: searchQuery, auth: process.env.CSE_API_KEY },     (err, resp) => {
                        if (err) {
                                
                                console.log('An error occured', err);
                            }
                        // Got the response from custom search
                        console.log('Result: ' + resp.searchInformation.formattedTotalResults);
                        if (resp.items && resp.items.length > 0) {
                                console.log('First result name is ' + resp.items[0].title);
                            }
                /*https.get(urlToQuery, (response) =>{
                            //let result;
                            response
                                .setEncoding('utf8')
                                .on('data', (data) =>{
                                            console.log( data);
                                        });
                }); */
                /*request(urlToQuery,{json: true}, (error, response, data) => {
                    console.log(JSON.stringify(data));
                   if(!error && response.statusCode == 200) {
                        let newData = data.items.map( item => {
                            return {
                                    url: item.link,
                                    snippet: item.snippet,
                                    thumbnail: item.image.thumbnailLink,
                                    context: item.image.contextLink
                                };
                        });
                    };*/
                });


               client
                    .query(`INSERT INTO  public."imageSearchHistory" ("term" ) VALUES ('${ req.params.query}');`)
                        .on('end', () => {
                                    res.writeHead(200, {'content-type': 'text/plain'});
                                    res.end(req.params.query);
                                    //res.end(JSON.stringify(urls, null, 4));
                                });
    });

    router.get('/api/latest', (req,res)=>{

        let ret = [];
        client
                .query(`SELECT
                            "term",
                            "when"
                        FROM
                            public."imageSearchHistory"
                        LIMIT 10;`
                 )
                .on('row', row => {
                            ret.push(row);
                        })
                .on('end', () =>{
                                    res.writeHead(200, {'content-type': 'text/plain'});
                                     res.end(JSON.stringify(ret,null, 4));
                                });




    });
});

module.exports = router;
