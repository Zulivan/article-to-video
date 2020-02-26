module.exports = function (argumentz, extradata) {
    return new Promise((success, error) => {
        const title = argumentz[0];
        const content = argumentz[0];
        const images = extradata['images'];

        const output = {
            type: 'data_type',
            values: images
        }
        success(output)
    })
};