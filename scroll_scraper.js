// FR: Script de scraping pensé pour les sites chargeant des éléments via un scrolling vers le bas de page. 
// EN: Scraping script made for websites that load results when the user scroll down the page.

var Nightmare = require('nightmare')
var fs = require('fs');
var Promise = require('promise');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM(`<!DOCTYPE html>`);
const $ = require('jQuery')(window);
var mysql = require('mysql');
var vo = require('vo');

// Controleur de flux
vo(run)(function(err, result) {
    if (err) throw err;
});


// FR: Ici, on se connecte sur le site et on scroll
// jusqu'à ce que tous les résultats soient affichés, puis on récupère toutes les urls

function* run() {
    var nightmare = Nightmare({show:true, height:1200, width: 1800}),
    currentPage = 1,
    nextExists = true,
    datas = [];

    yield nightmare
    .goto('your_url')
    .wait(2000)
    .wait('article')

    while (currentPage < 5) {
        yield nightmare.inject('js', 'jquery.js')
        var validPage = yield nightmare.exists('article');
        if (!validPage) {        
            break
        }
        yield nightmare.scrollTo(0, 0).wait(2000);
        var currentHeight = yield nightmare.evaluate( function() {
            return document.body.scrollHeight;
        });
        yield nightmare.scrollTo(currentHeight, 0)
        .wait(4000)
        ++currentPage;
    }

    datas.push(yield nightmare
        .evaluate(function() {
            var urls = [];
            $('article').each(function() {
                var url = $(this).attr('url');
                urls.push(url);
            })
            return urls;
        })
    )

    yield nightmare.end();
    console.log('BEFORE SCRAP');
    coordinator(datas, function(err, result) {
        console.log(result);
    });
}

// FR: Fonction intermediaire: récupère toutes les urls retournées puis déclenche la fonction write()
async function coordinator(urls, callback) {
    console.log('scrapEach');
    console.dir(urls);
    console.log('TOTAL URLS = '+urls.length)
    await write(urls);
    callback(null, 'OK');
};

// FR: Ecrit toutes les données récupérées par le scrap dans le fichier cible
function write(infos) {
    return new Promise(function (resolve, reject) {
        fs.open('./my_target_file.txt', 'a', 666, function (e, id) {
            var datas = JSON.stringify(infos);
            fs.write(id, datas, null, 'utf8', function () {
                fs.close(id, function () {
                    resolve('DONE');
                })
            })
        })
    })
}

