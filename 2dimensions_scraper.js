// FR: Script auquel on fournit une URL. Celui-ci va charger cette URL afin d'y récupérer toutes les URLs des annonces/articles/éléments ciblés 
// et contenues sur la page, et les stocker dans un array. Celui-ci est ensuite transmis à la fonction intermed() qui va itérer sur chaque URL. 
// L'URL en question est envoyée vers la fonction scrapIt() qui scrap la page correspondante, récupère les infos souhaitées, 
// et les stock dans un objet Js. Cet object est récupéré puis envoyé vers la fonction saveDatas() qui se charge d'insérer les infos en base de données

// EN: Script that receives an URL, loads the corresponding page and retrieves all the targetted elements Urls, that are therefore inserted in an array.
// The array is then given to the intermed() function which iterate upon it. The selected Url is sent to the scrapIt() function which scrap the page,
// get the targeted informations and insert it in a Js object. This one is then sent to the saveDatas() function which insert the datas into the database.

let Nightmare = require('nightmare')
let fs = require('fs');
let Promise = require('promise');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM(`<!DOCTYPE html>`);
const $ = require('jQuery')(window);
let mysql = require('mysql');

async function run() {
    let nightmare = Nightmare({show:false, height:1200});
    let urlsList = await new Promise(function(resolve, reject) {
        nightmare
        .goto('my_url')
        .wait(2000)
        .wait('h1')
        .inject('js', 'jquery.js')
        .evaluate(function() {
            let targetUrls = [];
            $('.article').each(function() {
                let url = $(this).attr('href');
                targetUrls.push(url);
            })
            return targetUrls;    
        })
        .end()
        .then(function(urls) {
            resolve(urls);
        })
        .catch(function(error) {
            reject(error);
        })
    }) 

    await intermed(urlsList, function(err, final_result) {
        console.log(final_result);
    });
}

async function intermed(urls, callback) {
    console.dir(urls);
    for (let url of urls) {    
        console.log(url);
        let results = await scrapIt(url);
        console.log(results);
        let savedDatas = await saveDatas(results); 
        console.log('WRITING DONE');
        console.log("NEXT URL");
    }
    let final_result = 'FINISH';
    callback(null, final_result);
}

function scrapIt(url) {
    return new Promise(function(resolve, reject) {        
        let nightmare = Nightmare({show: false, height: 1200})
        nightmare
            .goto(url)
            .wait(2000)
            .inject('js', 'jquery.js')
            .evaluate(function(url) {
                let urlAnnonce = url;
                let title = $('h1').text().trim();
                let city = $('address span[itemprop="addressLocality"]').text();
                let postalCode = $('address span[itemprop="postalCode"]').text();
                let address = $('address span[itemprop="streetAddress"]').text();
                let description = $('.description-residence span[itemprop="name"]').text();

                let results = {
                    url: urlAnnonce,
                    title: title,
                    city: city,
                    postalCode: postalCode,
                    address: address,
                    description: description
                };
                return results;
            }, url)
            .end()
            .then(function(results) {
                resolve(results);
            })
            .catch(function(error) {
                reject(error);
            })
    })
}

function saveDatas(datas) {
    return new Promise(function(resolve, reject) {
        var connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'my_db'
        });

        description = datas.description.replace("\\\\", "");
        description = datas.description.replace(/'/g, "\\'");
        city = datas.city.replace(/'/g, "\\'");
        address = datas.address.replace(/'/g, "\\'");

        connection.connect(function(err) {
            if (err) throw err;
            console.log('Connected to Database');
            let myQuery = `INSERT INTO my_table
            (url, title, address, postalCode, city, description, date_scraping) 
            VALUES('${datas.url}', '${datas.title}', '${adresse}',
            '${datas.postalCode}', '${city}', '${description}', NOW())`;

            connection.query(myQuery, function(err, result) {
                console.log('WRITING...');
                if (err) {
                    resolve(err);
                }
                connection.end();
                resolve(result);
            });
        });        
    })
}

run();