const express = require('express');
const router = express.Router();
const pg = require('pg');
const DATABASE_URL = 'postgres://fidbvttodbpssc:ygSkoG5ECKgTGVI_iTlB-MD2rQ@ec2-54-243-28-22.compute-1.amazonaws.com:5432/d6vqln1g3antb3';
//const imageSearcher = require("google-image-search-url-results");
var rp = require('request-promise');
var cheerio = require('cheerio');
/* GET home page. */

pg.defaults.ssl = true;


pg.connect(DATABASE_URL, (err, client) => {
    if (err) throw err;
    console.log('Connected to postgres! Getting tables...');

    router.get('/', (req, res) =>{
      res.render('index', { title: 'Express' });

    });

    router.get('/api/imagesearch/:query', (req,res)=>{
                console.log(req.params.query);
                const URL = 'http://images.google.com/search?tbm=isch&q='+encodeURIComponent(req.params.query);

     const urlsRet = rp(URL)
                    .then((html) =>{
                            const $ = cheerio.load(html);
                            const imgNodes = $('#ires td a img');
                            // imgNodes is merely an array-like object, sigh.
                            // This is purposedly old-school JS because newer stuff doesn't work:
                            let urls = [];

                            imgNodes.map(imgNodeIdx =>{
                                const imgNode = imgNodes[imgNodeIdx];
                                console.log(imgNode)
                                urls.push(imgNode.attribs['src']);
                                });

                          client
                                .query(`INSERT INTO  public."imageSearchHistory" ("term" ) VALUES ('${ req.params.query}');`)
                                .on('end', () => {
                                    res.writeHead(200, {'content-type': 'text/plain'});
                                    res.end(JSON.stringify(urls, null, 4));
                                });

                        });

                            //console.log(JSON.stringify(urlsRet))

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
                                     res.end(JSON.stringify(ret, null, 4));
                                });




    });
});

module.exports = router;
