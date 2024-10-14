import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import puppeteer from 'puppeteer';
import fs from 'fs';

@Injectable()
export class AppService {
  constructor(private http: HttpService) {}

  async getHello(profileUrl: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(profileUrl, { waitUntil: 'networkidle2' });

    // Extract image URLs
    const imageUrls = await page.evaluate(() => {
      const images = document.querySelectorAll('img'); // Selecting images on the page
      const urls = [];
      images.forEach((img) => urls.push(img.src)); // Collecting the URLs of the images
      return urls;
    });

    console.log(`Found ${imageUrls.length} images. Downloading...`);

    // Function to download images using axios
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const url = imageUrls[i];

        this.http
          .get(url, {
            responseType: 'stream', // Important to handle image streaming
          })
          .subscribe((response) => {
            // Save the image to the local filesystem
            const file = fs.createWriteStream(`image${i + 1}.jpg`);
            response.data.pipe(file);

            file.on('finish', () => {
              file.close();
              console.log(`Downloaded image${i + 1}`);
            });
          });
      } catch (error) {
        console.error(`Failed to download image ${i + 1}:`, error.message);
      }
    }

    await browser.close();
  }
}
