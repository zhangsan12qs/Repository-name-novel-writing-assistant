/**
 * S3对象存储工具类
 * 用于存储应用数据
 */

import { S3Storage } from "coze-coding-dev-sdk";

class S3StorageWrapper {
  private storage: S3Storage;

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: "",
      secretKey: "",
      bucketName: process.env.COZE_BUCKET_NAME,
      region: "cn-beijing",
    });
  }

  /**
   * 上传/更新文件
   */
  async putObject(key: string, content: string | Buffer, contentType: string = 'application/json'): Promise<string> {
    try {
      const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
      const actualKey = await this.storage.uploadFile({
        fileContent: buffer,
        fileName: key,
        contentType,
      });
      console.log(`[S3Storage] 文件已保存: ${actualKey}`);
      return actualKey;
    } catch (error) {
      console.error(`[S3Storage] 保存文件失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 读取文件
   */
  async getObject(key: string): Promise<string> {
    try {
      const buffer = await this.storage.readFile({ fileKey: key });
      return buffer.toString('utf-8');
    } catch (error) {
      console.error(`[S3Storage] 读取文件失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 删除文件
   */
  async deleteObject(key: string): Promise<boolean> {
    try {
      return await this.storage.deleteFile({ fileKey: key });
    } catch (error) {
      console.error(`[S3Storage] 删除文件失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 检查文件是否存在
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      return await this.storage.fileExists({ fileKey: key });
    } catch (error) {
      console.error(`[S3Storage] 检查文件存在性失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 列出文件
   */
  async listObjects(prefix?: string, maxKeys: number = 100): Promise<{
    keys: string[];
    isTruncated: boolean;
    nextContinuationToken?: string;
  }> {
    try {
      const result = await this.storage.listFiles({ prefix, maxKeys });
      return {
        keys: result.keys,
        isTruncated: result.isTruncated,
        nextContinuationToken: result.nextContinuationToken,
      };
    } catch (error) {
      console.error('[S3Storage] 列出文件失败:', error);
      return {
        keys: [],
        isTruncated: false,
      };
    }
  }

  /**
   * 生成签名URL
   */
  async generatePresignedUrl(key: string, expireTime: number = 86400): Promise<string> {
    try {
      return await this.storage.generatePresignedUrl({ key, expireTime });
    } catch (error) {
      console.error(`[S3Storage] 生成签名URL失败: ${key}`, error);
      throw error;
    }
  }
}

export const s3Storage = new S3StorageWrapper();
