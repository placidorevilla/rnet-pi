const RNetPacket = require("./RNetPacket");
const DataPacket = require("./DataPacket");
const ZoneInfoPacket = require("./ZoneInfoPacket");

module.exports = {
    build: function(buffer) {
        var packet = RNetPacket.fromData(buffer);

        switch (packet.messageType) {
            case 0x00:
                packet = DataPacket.fromPacket(packet);
                break;
            default:
                return false; // We don't care about anything else
        }

        // Data Messages
        if (packet.messageType == 0x00) {
            // Zone Info Response
            if (
                packet.sourcePath.length == 4 &&
                packet.sourcePath[0] == 0x02 && // Root Menu
                packet.sourcePath[1] == 0x00 // Run Mode
            ) {
                switch (packet.sourcePath[3]) {
                    case 0x07:
                        return ZoneInfoPacket.fromPacket(packet);
                    case 0x06:
                        return ZonePowerPacket.fromPacket(packet);
                    case 0x02:
                        return ZoneSourcePacket.fromPacket(packet);
                    case 0x01:
                        return ZoneVolumePacket.fromPacket(packet);
                }
            }
            else if (
                packet.sourcePath.length == 5 &&
                packet.sourcePath[0] == 0x02 && // Root Menu
                packet.sourcePath[1] == 0x00 &&// Run Mode
                packet.sourcePath[3] == 0x00 // User Parameters
            ) {
                return ZoneParameterPacket.fromPacket(packet);
            }
        }

        return false;
    }
}
