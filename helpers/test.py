
import pdfkit
import os
path_wkthmltopdf = "D:/home/site/wwwroot/helpers/wkhtmltox/bin/wkhtmltopdf.exe"
config = pdfkit.configuration(wkhtmltopdf=path_wkthmltopdf)
# print("middle")
pdf = pdfkit.from_url("http://google.com", False, configuration=config)
print(pdf)
print("done the python script is working")