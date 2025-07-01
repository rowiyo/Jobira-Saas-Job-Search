// src/app/api/cover-letters/export/route.ts
import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { convert } from 'html-to-text'

export async function POST(request: Request) {
  try {
    const { content, format } = await request.json()

    if (format === 'pdf') {
      // For serverless environments, use puppeteer-core with chromium
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      })

      const page = await browser.newPage()
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
              }
              p { margin-bottom: 1em; }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `
      
      await page.setContent(html)
      const pdf = await page.pdf({ format: 'A4' })
      await browser.close()

      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="cover-letter.pdf"'
        }
      })
    } else if (format === 'docx') {
      // Generate DOCX
      const text = convert(content, {
        wordwrap: false,
        preserveNewlines: true
      })

      const doc = new Document({
        sections: [{
          properties: {},
          children: text.split('\n').map(line => 
            new Paragraph({
              children: [new TextRun(line)],
              spacing: { after: 200 }
            })
          )
        }]
      })

      const buffer = await Packer.toBuffer(doc)
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="cover-letter.docx"'
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid format' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}