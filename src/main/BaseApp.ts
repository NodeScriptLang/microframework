import 'reflect-metadata';

import { InitializationError } from '@nodescript/errors';
import { Logger } from '@nodescript/logger';
import dotenv from 'dotenv';
import { dep, Mesh } from 'mesh-ioc';

const process = global.process;

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
    async start() {
        dotenv.config({ path: '.env' });
        if (process.env.NODE_ENV === 'development') {
            dotenv.config({ path: '.env.dev' });
        }
        if (process.env.NODE_ENV === 'test') {
            dotenv.config({ path: '.env.dev' });
            dotenv.config({ path: '.env.test' });
        }
        this.assertMissingDeps();
        this.logger.info('Starting application');
    }

    /**
     * Application shutdown code.
     * Called when production app gracefully terminates and during tests.
     */
    async stop() {
        this.logger.info('Stopping application');
    }

    /**
     * The method called by application entrypoint.
     * Tests do not use that.
     */
    async run() {
        try {
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
            process.removeAllListeners();
            await this.stop();
            process.exit(0);
        } catch (error) {
            this.logger.error(`Failed to stop ${this.constructor.name}`, { error });
            process.exit(1);
        }
    }

    assertMissingDeps() {
        const missingDepKeys = [...this.mesh.missingDeps()].map(_ => _.key);
        if (missingDepKeys.length > 0) {
            throw new InitializationError(`The following class dependencies are not found in application global scope: ${missingDepKeys}`);
        }
    }

}
