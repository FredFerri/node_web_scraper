// FR: Script auquel on fournit une liste d'URLs. Celles-ci sont scrapées une par une puis les informations
// obtenues sont ensuite insérées dans un fichier texte.
// EN: Script that receives a URL list file, which are then scraped one by one. The obtained results are 
// finally written in a text file.

var Nightmare = require('nightmare')
var fs = require('fs');
var Promise = require('promise');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM(`<!DOCTYPE html>`);
const $ = require('jQuery')(window);
var mysql = require('mysql');

var urls = require('./my_source_file').urls;

// EN: Loop on each url, launch the scrapEach() function, wait the return, and then launch the write() function before starting the next iteration
// FR: Fonction intermédiaire: boucle sur toutes les urls puis, a chaque résultat obtenu pour 1 url, déclenche la fonction write(), avant de démarrer la nouvelle itération
async function coordinator(urls) {
    console.log('scrapEach');
    for (url in urls) {
        console.log(urls[url]);
        let resultScraping = await scrapEach(urls[url]);
        console.dir(resultScraping);
        console.log('iterate');
        let resultWriting = await write(resultScraping);
    }
};

// EN: Function that scrap the web page from the URL given in parameter and returning the obtained results as a JavaScript object.
// FR: Fonction scrapant la page correspondant à l'URL donnée en paramètre et renvoyant les résultats obtenus sous forme d'objet Js.
function scrapEach(url) {
    return new Promise(function(resolve, reject) {
        var nightmare = Nightmare({show:true, height:1200});
        nightmare
        .goto(url)
        .wait(3000)
        .wait('h1')
        .inject('js', 'jquery.js')
        .evaluate(function(url) {
            let title = $('h1').text().trim();
            let description = $('.description').find('p').text();
            let infosContact = {
                name: $('.contact:nth-of-type(1) > .container > .header > .name').text(),
                address: $('.contact:nth-of-type(1) > .container > .address').text(),
                phone: $('.contact:nth-of-type(1) > .container > .contact > div:first-child').text(),
                mail: $('.contact:nth-of-type(1) > .container > .contact > .email > a').text(),
            };

            let infos = {
                title: title,
                description: description,
                infosContact: infosContact,
                url: url
            };
            return infos;
        }, url)
        .end()
        .then(function(result) {
            resolve(result);
        })
        .catch(function(error) {
            reject(error);
        })
    })
}

// EN: Function that writes the obtained results in a text file
// FR: Ecriture des résultats obtenus dans un fichier texte
function write(infos) {
    return new Promise(function (resolve, reject) {
        fs.open('./my_destination_file.txt', 'a', 666, function (e, id) {
            var datas = JSON.stringify(infos);
            fs.write(id, datas, null, 'utf8', function () {
                fs.close(id, function () {
                    resolve('DONE');
                })
            })
        })
    })
}

coordinator(urls);