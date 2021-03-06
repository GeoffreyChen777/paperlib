import { promises as fsP, constants } from 'fs'
import { getSetting } from 'src/js/settings'
import path from 'path'
import { uid } from 'quasar'
function replaceInvalidChar (string) {
  return string.replace(/:/g, '-').replace(/ /g, '_').replace(/\./g, '_').replace(/\?/g, '_')
}

function constructFilePath (title, author, year, suffix) {
  let newFilePath = getSetting('libPath')
  let newFileName = ''
  if (title) {
    newFileName = newFileName + replaceInvalidChar(title) + '_'
  }
  if (author) {
    newFileName = newFileName + replaceInvalidChar(author) + '_'
  }
  if (year) {
    newFileName = newFileName + replaceInvalidChar(year) + '_'
  }
  newFileName = newFileName + suffix
  newFilePath = path.join(newFilePath, newFileName)
  return newFilePath
}

async function copyFile (oriPath, newPath) {
  try {
    await fsP.access(newPath, constants.F_OK)
    console.log('Copy file exist: ' + newPath)
    return true
  } catch (err) {
    try {
      await fsP.copyFile(oriPath, newPath)
      return true
    } catch (err) {
      console.log('Copy file error: ' + err)
      return false
    }
  }
}

export async function copyFiles (paperMeta) {
  let title = null
  let author = null
  let year = null
  if (paperMeta.hasAttr('paperFile')) {
    const paperFile = paperMeta.paperFile.split('.')
    if (!paperMeta.hasAttr('title')) {
      title = uid()
    } else {
      if (paperMeta.hasAttr('title')) title = paperMeta.title
      if (paperMeta.hasAttr('authors')) author = paperMeta.authors.split(' and ')[0]
      if (paperMeta.hasAttr('pubTime')) year = paperMeta.year
    }
    const suffix = 'main.' + paperFile[paperFile.length - 1]
    const newFilePath = constructFilePath(title, author, year, suffix)
    const success = await copyFile(paperMeta.paperFile, newFilePath)
    if (success) {
      paperMeta.paperFile = newFilePath
    }
  } else {
  }

  if (paperMeta.hasAttr('attachments')) {
    for (let i = 0; i++; i < paperMeta.attachments.length) {
      const attachment = paperMeta.attachments[i]
      if (!attachment.startsWith('http')) {
        const attachmentFile = paperMeta.attachments[i].split('.')
        let attSuffix = attachmentFile[attachmentFile.length - 1]
        attSuffix = 'sup' + String(i) + '.' + attSuffix
        const newAttachmentPath = constructFilePath(title, author, year, attSuffix)
        const success = await copyFile(paperMeta.attachments[i], newAttachmentPath)
        if (success) {
          paperMeta.attachments[i] = newAttachmentPath
        }
      }
    }
  }
  return paperMeta
}

export async function deleteFile (filePath) {
  try {
    await fsP.unlink(filePath)
    return true
  } catch (err) {
    return false
  }
}

export async function deleteFiles (paperMeta) {
  // don't care success or not
  await deleteFile(paperMeta.paperFile)
  for (const i in paperMeta.attachments) {
    await deleteFile(paperMeta.attachments[i])
  }
}
