import { __extends } from "tslib";
import { getSerdePlugin } from "@aws-sdk/middleware-serde";
import { Command as $Command } from "@aws-sdk/smithy-client";
import { GetMapSpritesRequestFilterSensitiveLog, GetMapSpritesResponseFilterSensitiveLog, } from "../models/models_0";
import { deserializeAws_restJson1GetMapSpritesCommand, serializeAws_restJson1GetMapSpritesCommand, } from "../protocols/Aws_restJson1";
var GetMapSpritesCommand = (function (_super) {
    __extends(GetMapSpritesCommand, _super);
    function GetMapSpritesCommand(input) {
        var _this = _super.call(this) || this;
        _this.input = input;
        return _this;
    }
    GetMapSpritesCommand.prototype.resolveMiddleware = function (clientStack, configuration, options) {
        this.middlewareStack.use(getSerdePlugin(configuration, this.serialize, this.deserialize));
        var stack = clientStack.concat(this.middlewareStack);
        var logger = configuration.logger;
        var clientName = "LocationClient";
        var commandName = "GetMapSpritesCommand";
        var handlerExecutionContext = {
            logger: logger,
            clientName: clientName,
            commandName: commandName,
            inputFilterSensitiveLog: GetMapSpritesRequestFilterSensitiveLog,
            outputFilterSensitiveLog: GetMapSpritesResponseFilterSensitiveLog,
        };
        var requestHandler = configuration.requestHandler;
        return stack.resolve(function (request) {
            return requestHandler.handle(request.request, options || {});
        }, handlerExecutionContext);
    };
    GetMapSpritesCommand.prototype.serialize = function (input, context) {
        return serializeAws_restJson1GetMapSpritesCommand(input, context);
    };
    GetMapSpritesCommand.prototype.deserialize = function (output, context) {
        return deserializeAws_restJson1GetMapSpritesCommand(output, context);
    };
    return GetMapSpritesCommand;
}($Command));
export { GetMapSpritesCommand };
