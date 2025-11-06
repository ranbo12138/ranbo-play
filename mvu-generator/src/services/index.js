import { generateCodeArtifacts } from './codeGenerator.js'

export const services = {
  generateCode: generateCodeArtifacts,
  /**
   * 占位服务：后续将接入 TavernAI / MVU 相关的远程能力。
   */
  placeholder: () => {
    console.warn('服务功能尚未实现')
  },
}

export default services
