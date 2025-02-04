import { HttpChain, HttpContext, HttpErrorHandler, HttpMetricsHandler, HttpNext, HttpServer, HttpStatusHandler } from '@nodescript/http-server';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

export class AuxHttpServer extends HttpServer {

    @config({ default: 8081 })
    AUX_HTTP_PORT!: number;

    @dep() protected errorHandler!: HttpErrorHandler;
    @dep() protected metricsHandler!: HttpMetricsHandler;
    @dep() protected statusHandler!: HttpStatusHandler;

    constructor() {
        super();
        this.config.port = this.AUX_HTTP_PORT;
        this.config.shutdownDelay = 0;
        // TLS is not used for aux http server by default
        this.config.tlsCert = undefined;
        this.config.tlsKey = undefined;
        this.config.tlsCa = undefined;
        this.config.tlsCiphers = undefined;
    }

    protected handler = new HttpChain([
        this.errorHandler,
        this.metricsHandler,
        this.statusHandler,
    ]);

    async handle(ctx: HttpContext, next: HttpNext) {
        await this.handler.handle(ctx, next);
    }

}
