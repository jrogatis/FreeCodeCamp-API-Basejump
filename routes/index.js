const express = require('express');
const router = express.Router();
const pg = require('pg');
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
     const fullUrl = req.protocol + '://' + req.get('host'); //+ req.originalUrl;
      res.render('index', { fullUrl: fullUrl});

    });

    router.get('/api/imagesearch/:query/:page?', (req,res)=>{
            const searchQuery = req.params.query.split(' ').join('+');
            const page = (typeof req.params.page !== 'undefined') ? parseInt(req.params.page) : 0;
            var offset =  page * 10;
            offset = offset > 0 ? offset + 1 : offset;
            const startAt = (offset > 0) ? offset : 1;
            console.log(startAt);

            customsearch.cse.list({
                cx: process.env.CSE_ID,
                q: searchQuery,
                start: startAt,
                auth: process.env.CSE_API_KEY,
                imgSize: 'medium',
                searchType:'image'

                }, (err, resp) => {
                    if (err) console.log('An error occured', err)

                    if (resp.items && resp.items.length > 0) {
                        let data =[];
                        resp.items.map( item => {
                            data.push ({
                                            url: item.link,
                                            snippet: item.snippet,
                                            thumbnail: item.image.thumbnailLink,
                                            context: item.image.contextLink
                                        });


                               });
                          client
                                .query(`INSERT INTO  public."imageSearchHistory" ("term" ) VALUES ('${req.params.query}');`)
                                .on('end', () => {
                                            res.end(JSON.stringify(data, null, 4));
                                        });
                    }
                });

    });

    router.get('/api/latest', (req,res)=>{

        var ret = [];
        client
                .query(`SELECT
                            "term",
                            "when"
                        FROM
                            public."imageSearchHistory"
                        ORDER BY
                           "index" DESC
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
