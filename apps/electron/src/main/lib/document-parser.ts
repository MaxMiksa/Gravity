/**
 * 文档解析服务
 *
 * 负责从各类办公文档中提取纯文本内容。
 * 支持的格式：
 * - PDF：使用 pdf-parse 提取文本
 * - DOC：使用 word-extractor 提取文本（旧版 Word）
 * - DOCX/XLSX/PPTX/ODP/ODS/ODT：使用 officeparser 提取文本
 * - TXT/MD/CSV/JSON/XML/HTML/JS/TS/PY 等：直接 UTF-8 读取
 */

import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { resolveAttachmentPath } from './config-paths'

// ===== 文件类型分类 =====

/** officeparser 支持的格式 */
const OFFICE_EXTENSIONS = new Set([
  '.docx', '.xlsx', '.pptx',
  '.odt', '.odp', '.ods',
])

/** 纯文本格式（直接 UTF-8 读取） */
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.csv', '.json', '.xml', '.html',
  '.js', '.ts', '.py', '.yaml', '.yml', '.toml',
  '.log', '.ini', '.cfg', '.conf', '.sh', '.bat',
  '.css', '.scss', '.less', '.sql', '.graphql',
  '.env', '.gitignore', '.dockerfile',
])

/** 所有支持文档解析的扩展名（不含图片） */
const SUPPORTED_DOCUMENT_EXTENSIONS = new Set([
  '.pdf', '.doc',
  ...OFFICE_EXTENSIONS,
  ...TEXT_EXTENSIONS,
])

/**
 * 判断文件扩展名是否支持文本提取
 *
 * @param ext 文件扩展名（含点号，如 '.pdf'）
 */
export function isSupportedDocumentExtension(ext: string): boolean {
  return SUPPORTED_DOCUMENT_EXTENSIONS.has(ext.toLowerCase())
}

/**
 * 根据 MIME 类型判断是否为可解析文档（非图片附件）
 *
 * 排除图片类型，其余尝试按扩展名判断。
 */
export function isDocumentAttachment(mediaType: string): boolean {
  return !mediaType.startsWith('image/')
}

/**
 * 从文件中提取纯文本内容
 *
 * 根据文件扩展名选择合适的解析器：
 * - .pdf → pdf-parse
 * - .doc → word-extractor
 * - .docx/.xlsx/.pptx/.odt/.odp/.ods → officeparser
 * - .txt/.md/... → 直接 UTF-8 读取
 *
 * @param filePath 文件的完整路径
 * @returns 提取的纯文本内容
 * @throws 不支持的格式或解析失败时抛出错误
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase()

  // PDF 文件
  if (ext === '.pdf') {
    return extractPdf(filePath)
  }

  // 旧版 Word .doc 文件
  if (ext === '.doc') {
    return extractDoc(filePath)
  }

  // Office 和 OpenDocument 格式
  if (OFFICE_EXTENSIONS.has(ext)) {
    return extractOffice(filePath)
  }

  // 纯文本格式
  if (TEXT_EXTENSIONS.has(ext)) {
    return readFileSync(filePath, 'utf-8')
  }

  // 未知格式：尝试当作文本读取
  console.warn(`[文档解析] 未知格式 ${ext}，尝试作为文本读取: ${filePath}`)
  return readFileSync(filePath, 'utf-8')
}

/**
 * 提取 PDF 文本
 */
async function extractPdf(filePath: string): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const buffer = readFileSync(filePath)
  const result = await pdfParse(buffer)
  console.log(`[文档解析] PDF 提取完成: ${result.numpages} 页, ${result.text.length} 字符`)
  return result.text
}

/**
 * 提取旧版 Word (.doc) 文本
 */
async function extractDoc(filePath: string): Promise<string> {
  const WordExtractor = (await import('word-extractor')).default
  const extractor = new WordExtractor()
  const extracted = await extractor.extract(filePath)
  const text = extracted.getBody()
  console.log(`[文档解析] DOC 提取完成: ${text.length} 字符`)
  return text
}

/**
 * 提取 Office/OpenDocument 文本（DOCX, XLSX, PPTX, ODT, ODP, ODS）
 */
async function extractOffice(filePath: string): Promise<string> {
  const officeParser = await import('officeparser')
  const text = await officeParser.parseOfficeAsync(filePath)
  console.log(`[文档解析] Office 提取完成: ${text.length} 字符`)
  return text
}

/**
 * 从附件相对路径提取文本（IPC 层使用）
 *
 * 将附件的 localPath（如 {conversationId}/{uuid}.ext）
 * 解析为完整路径后提取文本。
 *
 * @param localPath 附件相对路径
 * @returns 提取的纯文本内容
 */
export async function extractTextFromAttachment(localPath: string): Promise<string> {
  const fullPath = resolveAttachmentPath(localPath)
  return extractTextFromFile(fullPath)
}
