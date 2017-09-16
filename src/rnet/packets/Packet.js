const SmartBuffer = require("smart-buffer").SmartBuffer;

module.exports = class Packet {
    constructor() {
        if (new.target === Packet) {
            throw new TypeError("Cannot initiate a Packet object. Packet is meant to be extended.");
        }

        if (this.getMessageType === undefined) {
            throw new TypeError("Packet subclasses must implement getMessageType()");
        }

        if (this.getTargetPath === undefined) {
            throw new TypeError("Packet subclasses must implement getTargetPath()");
        }

        if (this.writePacketBody === undefined) {
            throw new TypeError("Packet subclasses must implement writePacketBody(buf)");
        }
    }

    getBuffer() {
        const buffer = new SmartBuffer();
        buffer.writeUInt8(0xF0); // Start of message
        buffer.writeUInt8(this.getTargetControllerID());
        buffer.writeUInt8(this.getTargetZoneID());
        buffer.writeUInt8(this.getTargetKeypadID());
        buffer.writeUInt8(this.getSourceControllerID());
        buffer.writeUInt8(this.getSourceZoneID());
        buffer.writeUInt8(this.getSourceKeypadID());
        buffer.writeUInt8(this.getMessageType());
        {
            let targetPath = this.getTargetPath();
            buffer.writeUInt8(targetPath.length);
            for (let i = 0; i < targetPath.length; i++) {
                buffer.writeUInt8(targetPath[i])
            }
        }
        {
            let sourcePath = this.getSourcePath();
            buffer.writeUInt8(sourcePath.length);
            for (let i = 0; i < sourcePath.length; i++) {
                buffer.writeUInt8(sourcePath[i])
            }
        }

        this.writePacketBody(buffer);

        buffer.writeUInt8(this.calculateChecksum(buffer));
        buffer.writeUInt8(0xF7); // End of message;

        return buffer.toBuffer();
    }

    getTargetControllerID() {
        return 0x00;
    }

    getTargetZoneID() {
        return 0x00;
    }

    getTargetKeypadID() {
        return 0x7F; // The controller is the target
    }

    getSourceControllerID() {
        return 0x00;
    }

    getSourceZoneID() {
        return 0x00;
    }

    getSourceKeypadID() {
        return 0x70;
    }

    getSourcePath() {
        return [];
    }

    calculateChecksum(buffer) {
        const totalBytes = buffer.length;
        var byteSum = 0;

        buffer.moveTo(0);
        for (var i = 0; i < totalBytes; i++) {
            byteSum += buffer.readUInt8();
        }

        byteSum += totalBytes;
        byteSum = byteSum & 0x007F;

        if (byteSum > 127) {
            console.warn("Checksum is true byte! It happened not sure if I'm supposed to handle it. If whatever you tried to do didn't work, it means I do.")
        }

        return byteSum;
    }

    writeWithInvertUInt16LE(buffer, value) {
        var b = [
            value & 0x00FF,
            (value & 0xFF00) >> 8
        ];

        if (b[0] > 127) {
            buffer.writeUInt8(0xF1); // Invert signal
            buffer.writeUInt8(~ b[0] & 0xFF); // Invert
        }
        else {
            buffer.writeUInt8(b[0]);
        }

        buffer.writeUInt8(b[1]);
    }

    writeWithInvertUInt8(buffer, value) {
        var b = value & 0x00FF

        if (b > 127) {
            buffer.writeUInt8(0xF1); // Invert signal
            buffer.writeUInt8(~ b & 0xFF); // Invert
        }
        else {
            buffer.writeUInt8(b);
        }
    }
}
