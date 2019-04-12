// FR: Script utilisé pour récupérer des résultats retournés apres la validation d'un formulaire en plusieurs étapes. Dans le cas présent, il s'agit
// d'un formulaire contenant des <select> à partir desquels l'utilisateur doit faire un choix.
// EN: Script used to retrieve datas returned after a form validation. In the current case, the form got <select> options that have to be filled.

var Nightmare = require('nightmare')
var fs = require('fs');
var Promise = require('promise');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM(`<!DOCTYPE html>`);
const $ = require('jQuery')(window);

var datasList = require('./coords').coords;


function scrapEach(line, num) {
    return new Promise(function (resolve, reject) {
        console.log('SCRAP BEGINS');
        var city = line.city;
        var street = line.id_street;
        var nightmare = Nightmare({show: true, height: 1200})
        nightmare
            .goto('my_url')
            .wait('#ville')
            .select('select#ville', city)
            .wait(4000)
            .wait('#rues')
            .select('select#rues', street)
            .wait(4000)
            .click('input.rechercher')
            .wait('select[name="num"')
            .select('select[name="num"', num)
            .click('input.rechercher')
            .wait(4000)
            .wait('#rues')
            .inject('js', 'jquery.js')
            .evaluate(function (num) {
                function stripHtml(string) {
                    var regex = /\s?(\n)/ig
                    var result = string.replace(regex, "");
                    return result;
                }

                var datas = [];
                var ville = $('#ville option:selected').text();
                var current_street = $('#rues option:selected').text();
                var etablissement = document.querySelector('.resul-sectorisation .contenu h3').innerText;
                var infos = document.querySelector('.resul-sectorisation .contenu p').innerText;
				var detail = $('option[value="'+num+'"]').text(); 

                datas.push({
                    street: current_street,
                    city: city,
                    etablissement: etablissement,
                    infos: infos,
					num: detail
                })
                return datas;

            }, num)
            .end()
            .then(function (result) {
                resolve(result);
            })
            .catch(function (error) {
                reject(error);
            })
        var nightmare = Nightmare({show: true, height: 1200})
    })
};


function write(cityInfos) {
    return new Promise(function (resolve, reject) {
        fs.open('./my_target_file.txt', 'a', 666, function (e, id) {
            var datas = JSON.stringify(cityInfos);
            fs.write(id, datas, null, 'utf8', function () {
                fs.close(id, function () {
                    resolve('DONE');
                })
            })
        })
    })
};


async function intermed(line, num, callback) {
    console.log(line.ville);
    console.log(num);
    var message = '';
    console.log('BEFORE SCRAP');
    var promiseReturn = await scrapEach(line, num);
    console.log('SCRAPING DONE');
    console.log(promiseReturn);
    console.log(promiseReturn);
    var writeReturn = await write(promiseReturn);
    console.log('WRITING DONE');
    callback(null, writeReturn);
};

// FR: Fonction de départ. Dans le cas présent le parametre passé est un tableau associatif.
// EN: Starting function. In the current case, the given parameter is an associative array.
async function cityList(datasList) {
    for (const line of datasList) {
        for (const num of line.nums) {
            if (num == 0) {
                continue;
            }
            await intermed(line, num, async function (err, result) {
                console.log('ITERATION END');
            })
            console.log('NEXT STREET');
        }
        console.log('NEXT CITY');
    }
    console.log('FIN');
};

cityList(datasList);

