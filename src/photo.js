class Photo {
	constructor(photo) {
		this.url = photo.url;
		this.imageurl = photo.imageurl;
		this.thumburl = photo.thumburl;
		this.largeurl = photo.largeurl;
		this.originurl = photo.largeurl.replace(/@.+\..+$/g, '');
		this.type = this.originurl.match(/^.+\.(?<type>.+)$/).groups.type.toLowerCase();
	}

	isGif() {
		return this.type === 'gif';
	}
}

export default Photo;
