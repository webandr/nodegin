const moment = require('moment');

var authT="";

const express = require('express');

var fs = require('fs');
var fsp = require('fs').promises;
const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');

// const app = express();
const port = 4000;

// /home/a58355/web/perervaad.ru/public_html/expressapp/encryption
// скопировать в файлы в папке encription в соответствии с комментариями ниже 
var key = fs.readFileSync('/home/a58355/web/perervaad.ru/public_html/expressapp/encryption/private.key'); // <-- SSL Key 
var cert = fs.readFileSync( '/home/a58355/web/perervaad.ru/public_html/expressapp/encryption/primary.crt' );  // <--  SSL Certificate 
var ca = fs.readFileSync( '/home/a58355/web/perervaad.ru/public_html/expressapp/encryption/intermediate.crt' ); // <-- SSL Certificate Authority / Intermediate 

var options = {
    key: key,
    cert: cert,
    ca: ca
  };

const app = express();

// var http = require('http');
// http.createServer(app).listen(3081);

// Запуск сервера
var https = require('https');
https.createServer(options, app).listen(port);
console.log(`Сервер запущен на http://localhost:${port}`);


var forceSsl = require('express-force-ssl');
const { time } = require('console');
app.use(forceSsl);


// Middleware для обработки JSON
app.use(express.json());


// -------------------------------------------------------------------------------------------------------------------------------

// Функция для удаления файла
async function deleteFile(filePath) {
    try {
        // Проверяем, существует ли файл
        await fsp.access(filePath);
        // Удаляем файл
        await fsp.unlink(filePath);
        console.log(`Файл "${filePath}" успешно удален.`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log(`Файл "${filePath}" не существует.`);
        } else {
            console.error('Ошибка при удалении файла:', err);
        }
    }
}


// -------------------------------------------------------------------------------------------------------------------------------


// Маршрут для анализа тональности с использованием Python-скрипта
app.post('/getdoc', (req, res) => {
    const templatename = req.body.templatename; // rn = tmpl-rn.doc
    const xml = req.body.xml; // release notes xml
    const fileName = req.body.filename; // releaseNotes

    if (!xml) {
        return res.status(400).json({ error: 'Текст не предоставлен' });
    }

    // Путь к Python-скрипту
    const pythonScriptPath = path.join(__dirname, 'create_doc.py');
    
    // Получаем текущую дату и время в нужном формате
    const dateTime = moment().format('YYYYMMDD_HHmmss_SSS');

    // Разделяем имя файла и расширение
    const fileInfo = path.parse(fileName);

    // Собираем новое имя файла с добавлением даты и времени
    const newFileName = `${fileInfo.name}_${dateTime}${fileInfo.ext}`

    runparams = {
        templatename: templatename,
        xml: xml,
        filename: newFileName
    }
    console.log(runparams)

    // Вызов Python-скрипта
    exec(`python3 ${pythonScriptPath} '${JSON.stringify(runparams)}'`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка: ${error.message}`);
            return res.status(500).json({ error: 'Ошибка при выполнении Python-скрипта' });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ error: 'Ошибка в Python-скрипте' });
        }

        try {
            // Парсинг результата из stdout
            const r = stdout.replace(/'/g, '"');
            console.log(r);

            //const result = JSON.parse(r);
            
            // path.join(__dirname, fileName);
            const filePath = path.join(__dirname, `${newFileName.trim()}.docx`); 
            
            console.log(`filePath = ${filePath}`)

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Файл не найден' });
            }

            // Отправка файла как содержимого ответа
            res.sendFile(filePath, async (err) => {
                if (err) {
                    console.error('Ошибка при отправке файла:', err);
                    res.status(500).json({ error: 'Ошибка при отправке файла' });
                } 
                else {
                    console.log('Файл успешно передан:', filePath);
                    await deleteFile(filePath);
                }
            });
            // return res.status(200).json({ file:  `${fileName.trim()}.docx` }); 
            return;
        } catch (e) {
            console.error('Ошибка при парсинге JSON:', e);
            return res.status(500).json({ error: 'Ошибка при обработке результата' });
        }
    });
});

// Маршрут для анализа тональности с использованием Python-скрипта
app.post('/downloaddoc', (req, res) => {
    const templatename = req.body.templatename; // rn = tmpl-rn.doc
    const xml = req.body.xml; // release notes xml
    const fileName = req.body.filename; // releaseNotes

    if (!xml) {
        return res.status(400).json({ error: 'Текст не предоставлен' });
    }

    // Путь к Python-скрипту
    const pythonScriptPath = path.join(__dirname, 'create_doc.py');

    // Получаем текущую дату и время в нужном формате
    const dateTime = moment().format('YYYYMMDD_HHmmss_SSS');

    // Разделяем имя файла и расширение
    const fileInfo = path.parse(fileName);

    // Собираем новое имя файла с добавлением даты и времени
    const newFileName = `${fileInfo.name}_${dateTime}${fileInfo.ext}`

    runparams = {
        templatename: templatename,
        xml: xml,
        filename: newFileName
    }
    console.log(runparams)

    // Вызов Python-скрипта
    exec(`python3 ${pythonScriptPath} '${JSON.stringify(runparams)}'`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка: ${error.message}`);
            return res.status(500).json({ error: 'Ошибка при выполнении Python-скрипта' });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ error: 'Ошибка в Python-скрипте' });
        }

        try {
            // Парсинг результата из stdout
            const r = stdout.replace(/'/g, '"');
            console.log(r);

            //const result = JSON.parse(r);
            
            // path.join(__dirname, fileName);
            const filePath = path.join(__dirname, `${newFileName.trim()}.docx`); 
            
            console.log(`filePath = ${filePath}`)

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Файл не найден' });
            }

            // Отправка файла как содержимого ответа
            res.download(filePath, async (err) => {
                if (err) {
                    console.error('Ошибка при отправке файла:', err);
                    res.status(500).json({ error: 'Ошибка при отправке файла' });
                }
                else {
                    console.log('Файл успешно передан:', filePath);
                    await deleteFile(filePath);
                }
            });
            return;
        } catch (e) {
            console.error('Ошибка при парсинге JSON:', e);
            return res.status(500).json({ error: 'Ошибка при обработке результата' });
        }
    });
});

const API_PERERVA_URL = 'https://perervaad.ru:3080';

// **************************************************************************************
// АВТОРИЗАЦИЯ 
// **************************************************************************************
async function getPadAuth(){
    res = {};
    // Заголовки запроса
    const headers = {
        'Content-Type': 'application/json'
    };

    var data = JSON.stringify({
        "login": "user1",
        "password": "password1",
        "tokenKey": "2a2b-3c4d-5e6f-7g8h"
    });

    try {
        // Отправка запроса к Hugging Face API
        const response = await axios.post(API_PERERVA_URL + '/auth', data, { headers });

        // Обработка ответа
        if (response.status === 200) {
            const result = response.data;
            console.log(result);
            console.log(result.token);
            res = {status: response.status, authKey:  result.token};
            return res;
        } else {
            res = {status: 500, error: 'Ошибка при запросе к perervaad.ru' };
            return res;
        }
    } catch (error) {
        console.error('Ошибка:', error.message);
        res = {status: 500, error: 'Что то пошло не так. Ошибка в функции запроса к perervaad.ru' };
        return res;
    }

}
// **************************************************************************************
//  ПОЛУЧИТЬ КЛЮЧ ДЛЯ ОЗВУЧКИ 
// **************************************************************************************
async function getSayitKey(){
    let authRes =  await getPadAuth();
    res = {};
    if (authRes.status!=200 ){
        res = {status: 500, error: 'Ошибка при авторизации на perervaad.ru' + authT};
        return res;
    }
    authT = authRes.authKey;

    // URL API
    const API_URL = API_PERERVA_URL + '/sayitat';

    // Заголовки запроса
    const headers = {
        'Authorization': `Bearer ${authT}`,
        'Content-Type': 'application/json'
    };

    try {
        // Отправка запроса к Hugging Face API
        const response = await axios.get(API_URL, { headers });

        // Обработка ответа
        if (response.status === 200) {
            const result = response.data;
            console.log(result.access_token);
            res = {status: response.status, theKey: result.access_token, authKey: authT};
            return res;
        } else {
            res = {status: response.status, authKey: authT};
            return res;
        }
    } catch (error) {
        console.error('Ошибка:', error.message);
        res = {status: 500,  error: 'Ошибка в getSayKey ' + error.message };
        return res;
    }
};

// text 2 speach 
app.post("/sayit-ssp", async (req, res) => {
    var result;

    let sayitKey =  await getSayitKey();
    console.log(sayitKey);

    const fileName = "res.wav"; //req.body.fileName;
    if (!fileName) {
        return res.status(400).json({ error: 'Имя файла не указано' });
    }

    //path.join(__dirname, fileName);
    const filePath = path.join('/home/a58355/web/perervaad.ru/public_html/expressapp/', fileName); 
    console.log(filePath);

    // если не переданы данные, возвращаем ошибку
    if(!req.body) return response.sendStatus(400);

    console.log("request.body", req.body);
   
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

    var options = {
        'method': 'POST',
        'hostname': 'smartspeech.sber.ru',
        'path': '/rest/v1/text:synthesize?format=wav16&voice=May_24000',
        'headers': {
            'Content-Type': 'application/ssml',
            'Authorization': 'Bearer ' + sayitKey.theKey
        },
      'maxRedirects': 20,
      'responseType': 'arraybuffer'
    };
    
    var reqst = https.request(options, function (res) {
      var chunks = [];
      var result;
    
      res.on("data", function (chunk) {
        chunks.push(chunk);
        return;
      });
    
      res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        //console.log(body);
        //console.log("Текст распознан. Смотри " + __dirname + "\\" + fName); //body.toString()

        if (fs.existsSync(filePath))
                fs.unlinkSync(filePath);

        var out = fs.createWriteStream(filePath);
        out.write(body);
        out.close;
        
        console.log("result", filePath);
        //response.send(JSON.stringify({"result": fName}));

        return;
      });
    
      res.on("error", function (error) {
        console.error(error);
        response.send(JSON.stringify({"error": error.toString()}));
        return;
      });
    });
    
    // получаем данные
    var postData =  req.body.text;
    
    reqst.write(postData);
    reqst.end();

    // Отправка файла как содержимого ответа
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Ошибка при отправке файла:', err);
            res.status(500).json({ error: 'Ошибка при отправке файла' });
        }
    });
});