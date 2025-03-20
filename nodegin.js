const moment = require('moment');

var authT="";

const express = require('express');

var fs = require('fs');
var fsp = require('fs').promises;
const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');

// const app = express();
const port = 3000;

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

