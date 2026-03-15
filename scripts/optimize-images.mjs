import sharp from 'sharp'
import { readdirSync } from 'fs'
import { join, extname, basename } from 'path'

const dir = 'public'
const files = readdirSync(dir).filter(f => /\.(png|jpg|jpeg)$/i.test(f))

for (const file of files) {
  const input = join(dir, file)
  const name = basename(file, extname(file))
  const output = join(dir, `${name}.webp`)

  const info = await sharp(input)
    .webp({ quality: 80 })
    .toFile(output)

  console.log(`${file} → ${name}.webp (${(info.size / 1024).toFixed(0)} KB)`)
}
