from docxtpl import DocxTemplate
import xml.etree.ElementTree as ET
from docx2pdf import convert

from datetime import datetime
import sys
import json

import os

# Получение JSON-строки из аргументов
if len(sys.argv) < 2:
    print("Использование: python createpdf.py '<JSON данные>'")
    sys.exit(1)

# Парсинг JSON
try:
    rundata = json.loads(sys.argv[1])
except json.JSONDecodeError:
    print("Ошибка: Неверный формат JSON")
    sys.exit(1)

# Использование данных
print(f"Релиз нотес: {rundata['xml']}")

# Получение XML-строки из JSON
xml_string = rundata['xml']

# Парсинг XML из строки
root = ET.fromstring(xml_string)

# # Загрузка XML-данных
# tree = ET.parse('releasenotes.xml')
# root = tree.getroot()

# Преобразование XML в словарь
data = {}
for child in root:
    data[child.tag] = child.text

# Полный путь к шаблону
template_path = os.path.join(os.path.dirname(__file__), f"{rundata['templatename']}.docx")

# Загрузка шаблона Word
doc = DocxTemplate(template_path)

# Заполнение шаблона данными
doc.render(data)

# Получение текущего времени
now = datetime.now()
# Форматирование времени в строку
timestamp = now.strftime("%Y%m%d_%H%M%S")  # Формат: ГодМесяцДень_ЧасыМинутыСекунды
# Формирование имени файла
tempfilename = f"{rundata['filename']}_{timestamp}"
print(f"Имя файла: {tempfilename} .docx")

# Сохранение заполненного документа
#doc.save(f"{tempfilename}.docx")

# Полный путь к файлу с результатом
result_path = os.path.join(os.path.dirname(__file__), f"{rundata['filename']}.docx")
doc.save(result_path)


# Конвертация в PDF
# convert(f"{tempfilename}.docx", f"{tempfilename}.pdf")

# Удаление временного файла
# os.remove(f"{tempfilename}.docx")
# print(f"Временный файл f{tempfilename}.docx удалён.")s