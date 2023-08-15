import 'reflect-metadata';

import { Logger } from '@nodescript/logger';
import dotenv from 'dotenv';
import { dep, Mesh } from 'mesh-ioc';

/**
 * Common application setup with Mesh IoC, logger and start/stop hooks.
 */
export abstract class BaseApp {

    @dep() logger!: Logger;

    constructor(readonly mesh: Mesh) {
        this.mesh.connect(this);
    }

    /**
     * Application initialization code.
     * Called on production startup and during tests.
     */
    abstract start(): Promise<void>;

    /**
     * Application shutdown code.
     * Called when production app gracefully terminates and during tests.
     */
    abstract stop(): Promise<void>;

    /**
     * Read .env files according to NODE_ENV.
     * Called on production startup and during tests.
     */
    async configure() {
        dotenv.config({ path: '.env' });
        if (process.env.NODE_ENV === 'development') {
            dotenv.config({ path: '.env.dev' });
        }
        if (process.env.NODE_ENV === 'test') {
            dotenv.config({ path: '.env.test' });
        }
    }

    /**
     * The method called by application entrypoint.
     * Tests do not use that.
     */
    async run() {
        try {
            process.removeAllListeners();
            process.on('uncaughtException', error => {
                this.logger.error('uncaughtException', { error });
            });
            process.on('unhandledRejection', error => {
                this.logger.error('unhandledRejection', { error });
            });
            process.on('SIGTERM', async () => {
                this.logger.info('Received SIGTERM');
                await this.shutdown();
            });
            process.on('SIGINT', async () => {
                this.logger.info('Received SIGINT');
                await this.shutdown();
            });
            await this.start();
        } catch (error) {
            this.logger.error(`Failed to start ${this.constructor.name}`, { error });
            process.exit(1);
        }
    }

    /**
     * Called on SIGTERM/SIGINT, when the app is running using `run()`.
     * Tests do not use that.
     */
    async shutdown() {
        try {
            this.logger.info('Application shutting down');
            process.removeAllListeners();
            await this.stop();
            process.exit(0);
        } catch (error) {
            this.logger.error(`Failed to stop ${this.constructor.name}`, { error });
            process.exit(1);
        }
    }

}
