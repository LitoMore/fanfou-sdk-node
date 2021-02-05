class FanfouError extends Error {
	constructor(error) {
		super();
		this.name = 'FanfouError';
		this.err = error;
		if (error.name === 'HTTPError') {
			const [contentType] = error.response.headers['content-type'].split(';');
			switch (contentType) {
				case 'application/json': {
					this.message = JSON.parse(error.response.body).error;
					break;
				}

				case 'text/html': {
					const titleMatch = error.response.body.match(/<title>(?<msg>.+)<\/title>/);
					if (titleMatch) {
						const {msg} = titleMatch.groups;
						this.message = msg;
					} else {
						this.message = `${error.response.statusCode} error`;
					}

					break;
				}

				case 'application/xml': {
					const errorMatch = error.response.body.match(/<error>(?<msg>.+)<\/error>/);
					if (errorMatch) {
						const {msg} = errorMatch.groups;
						this.message = msg;
					} else {
						this.message = `${error.response.statusCode} error`;
					}

					break;
				}

				default: {
					this.message = 'Unknown error';
					break;
				}
			}
		} else {
			this.message = error.message ? error.message : 'Unknown error';
		}
	}
}

export default FanfouError;

