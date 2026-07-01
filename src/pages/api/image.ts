import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.query;

  const images: Record<string, string> = {
    'hero': 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\6a03d63e-c3e2-4572-a5e9-7253b8aa3ef8\\drought_somalia_hero_1782901309302.png',
    'nomads': 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\6a03d63e-c3e2-4572-a5e9-7253b8aa3ef8\\water_scarcity_nomads_1782901321391.png',
    'well': 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\6a03d63e-c3e2-4572-a5e9-7253b8aa3ef8\\water_well_restored_1782901341143.png',
    'step1': 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\6a03d63e-c3e2-4572-a5e9-7253b8aa3ef8\\how_it_works_step1_1782901769411.png',
    'step2': 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\6a03d63e-c3e2-4572-a5e9-7253b8aa3ef8\\how_it_works_step2_1782901780265.png',
    'step3': 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\6a03d63e-c3e2-4572-a5e9-7253b8aa3ef8\\how_it_works_step3_1782901790506.png',
    'step4': 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\6a03d63e-c3e2-4572-a5e9-7253b8aa3ef8\\water_well_restored_1782901341143.png'
  };

  const imagePath = images[name as string];

  if (!imagePath || !fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }

  const stat = fs.statSync(imagePath);
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': stat.size
  });

  const readStream = fs.createReadStream(imagePath);
  readStream.pipe(res);
}
