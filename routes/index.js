const express = require('express');
const router = express.Router();
const pg = require('pg');
const request = require('request');
require('dotenv').config();
const google = require('googleapis');
const customsearch = google.customsearch('v1');



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

            console.log(process.env.CSE_ID);
            customsearch.cse.list({ cx: process.env.CSE_ID,
                                    q: searchQuery,
                                    auth: process.env.CSE_API_KEY,
                                    imgSize: 'medium',
                                    searchType:'image' }, (err, resp) => {
                                    if (err) {

                                            console.log('An error occured', err);
                                        }
                        // Got the response from custom search
                                    console.log('Result: ' + resp.searchInformation.formattedTotalResults);
                                    if (resp.items && resp.items.length > 0) {
                                            console.log('First result name is ' + resp.items[0].title);
                                    }

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
