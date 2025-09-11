/**
 * StreamLogger Transform - Logs stream content while passing it through unchanged
 * Non-intrusive logging utility for debugging fully processed streaming responses
 */
export class StreamLoggerTransform extends TransformStream<any, any> {
    private logger: any;
    private streamType: string;
    private messagePrefix: string;
    private loggedChunks: number = 0;

    constructor(logger: any, streamType: 'agent' | 'regular' = 'regular', messagePrefix: string = '') {
        super({
            transform: (chunk: any, controller) => {
                this.loggedChunks++;
                
                // Log the chunk content with JB marker
                if (this.logger) {
                    // Base log object with common fields
                    const logEntry = {
                        chunkNumber: this.loggedChunks,
                        streamType: this.streamType
                    };

                    if (typeof chunk === 'string') {
                        // For raw string chunks (regular streams)
                        Object.assign(logEntry, {
                            chunkType: 'string',
                            chunkContent: chunk
                        });
                    } else if (chunk instanceof Uint8Array) {
                        // Decode Uint8Array to readable text
                        const decodedText = new TextDecoder().decode(chunk);
                        Object.assign(logEntry, {
                            chunkType: 'Uint8Array',
                            chunkContent: decodedText
                        });
                    } else if (typeof chunk === 'object') {
                        // For parsed SSE events (agent streams) 
                        Object.assign(logEntry, {
                            chunkType: 'object',
                            event: chunk.event,
                            data: chunk.data,
                            chunkContent: chunk
                        });
                    } else {
                        // For other chunk types
                        Object.assign(logEntry, {
                            chunkType: typeof chunk,
                            chunkContent: chunk
                        });
                    }

                    Object.assign(logEntry, {msg: `*JB* ${this.messagePrefix} streaming chunk #${this.loggedChunks}`});

                    this.logger.trace(logEntry);
                }
                
                // Pass chunk through unchanged
                controller.enqueue(chunk);
            },
            flush: (controller) => {
                // Log stream completion
                if (this.logger) {
                    this.logger.trace({
                        totalChunks: this.loggedChunks,
                        streamType: this.streamType,
                        msg: `*JB* Stream processing completed - ${this.loggedChunks} chunks processed (${this.streamType})`
                    });
                }
            }
        });
        
        this.logger = logger;
        this.streamType = streamType;
        this.messagePrefix = messagePrefix;
    }
}