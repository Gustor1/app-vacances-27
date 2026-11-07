# Synthetic, reproducible fixtures only. Requires reportlab 4.5.1; runtime app does not.
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pdfencrypt import StandardEncryption
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageDraw
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
root=Path(__file__).parent

def pdf(name, lines=None, pages=1, encrypted=False, scan=False):
 c=canvas.Canvas(str(root/name), pageCompression=1, encrypt=StandardEncryption('fixture-only') if encrypted else None, invariant=1)
 for page in range(pages):
  if scan:
   image=Image.new('RGB',(500,100),'white');ImageDraw.Draw(image).text((10,30),'Fictional scanned itinerary',fill='black');c.drawImage(ImageReader(image),40,700,width=500,height=100)
  else:
   for x,y,text in (lines or [(40,780,'# Escale fictive'),(40,750,'Ville: Albi'),(40,720,'Jour 1 - 2027-05-03'),(40,690,'- 09:00 : Musee rouge'),(40,660,'- Matin : Jardin bleu')]):
    c.drawString(x,y,text)
  c.showPage()
 c.save()
pdf('simple.pdf');pdf('columns.pdf',[(40,780,'# Escale fictive'),(40,750,'Ville: Albi'),(40,720,'Jour 1'),(40,690,'- Musee gauche'),(320,720,'Jour 2'),(320,690,'- Jardin droit')]);pdf('table.pdf',[(40,780,'# Escale fictive'),(40,750,'Ville: Albi'),(40,720,'Jour 1'),(40,690,'Heure'),(180,690,'Activite'),(40,660,'09:00'),(180,660,'Musee rouge')]);pdf('scan.pdf',scan=True);pdf('protected.pdf',encrypted=True);pdf('pages-51.pdf',pages=51)
pdf('long.pdf',[(40,780-i*12,'a'*70) for i in range(60)],pages=13)
(root/'corrupt.pdf').write_bytes(b'%PDF-1.7\ncorrupt fixture')
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
c=canvas.Canvas(str(root/'chinese.pdf'),invariant=1);c.setFont('STSong-Light',12)
for i,text in enumerate(['# 上海旅行','城市：上海','第1天 - 2027-05-03','- 上午：博物馆']): c.drawString(40,780-i*30,text)
c.save()
