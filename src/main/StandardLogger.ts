import { ConsoleLogger, DefaultLogFormatter, StructuredLogFormatter } from '@nodescript/logger';
import { config } from 'mesh-config';

export class StandardLogger extends ConsoleLogger {

    @config({ default: 'info' }) LOG_LEVEL!: string;
    @config({ default: false }) LOG_PRETTY!: boolean;

    constructor() {
        super();
        this.formatter = this.LOG_PRETTY ? new DefaultLogFormatter() : new StructuredLogFormatter();
        this.setLevel(this.LOG_LEVEL);
    }

}
