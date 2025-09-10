/**
 * StreamLogger Transform - Logs stream content while passing it through unchanged
 * Non-intrusive logging utility for debugging fully processed streaming responses
 */
export class StreamLoggerTransform extends TransformStream<any, any> {
    private logger: any;
    private streamType: string;
    private loggedChunks: number = 0;

    constructor(logger: any, streamType: 'agent' | 'regular' = 'regular') {
        super({
            transform: (chunk: any, controller) => {
                this.loggedChunks++;
                
                // Log the chunk content with JB marker
                if (this.logger) {
                    if (typeof chunk === 'string') {
                        // For raw string chunks (regular streams)
                        this.logger.trace({
                            chunkNumber: this.loggedChunks,
                            streamType: this.streamType,
                            chunkType: 'string',
                            chunkContent: chunk,
                            msg: `*JB* Fully processed streaming chunk #${this.loggedChunks} (${this.streamType})`
                        });
                    } else if (chunk instanceof Uint8Array) {
                        // Decode Uint8Array to readable text
                        const decodedText = new TextDecoder().decode(chunk);
                        this.logger.trace({
                            chunkNumber: this.loggedChunks,
                            streamType: this.streamType,
                            chunkType: 'Uint8Array',
                            chunkContent: decodedText,
                            msg: `*JB* Fully processed streaming chunk #${this.loggedChunks} (${this.streamType}) - DECODED`
                        });
                    } else if (typeof chunk === 'object') {
                        // For parsed SSE events (agent streams) 
                        this.logger.trace({
                            chunkNumber: this.loggedChunks,
                            streamType: this.streamType,
                            chunkType: 'object',
                            event: chunk.event,
                            data: chunk.data,
                            chunkContent: chunk,
                            msg: `*JB* Fully processed streaming chunk #${this.loggedChunks} (${this.streamType})`
                        });
                    } else {
                        // For other chunk types
                        this.logger.trace({
                            chunkNumber: this.loggedChunks,
                            streamType: this.streamType,
                            chunkType: typeof chunk,
                            chunkContent: chunk,
                            msg: `*JB* Fully processed streaming chunk #${this.loggedChunks} (${this.streamType})`
                        });
                    }
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
    }
}