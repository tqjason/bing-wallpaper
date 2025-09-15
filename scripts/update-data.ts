import fs from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

const endpoint = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=10&mkt=zh-CN';
const dataFilePath = join(__dirname, '..', 'json', 'data.json');

fetch(endpoint)
	.then((rsp) => rsp.json())
	.then(({ images }: any) => {
		const str = fs.readFileSync(dataFilePath, 'utf8');
		const result = JSON.parse(str);
		const getChinaDate = fd => {
			const utc1 = new Date(Date.UTC(fd.slice(0,4), fd.slice(4,6)-1, fd.slice(6,8), fd.slice(8,10), fd.slice(10,12)));
			const chinaDate = utc1.toLocaleDateString('en-CA', {timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'});
			return chinaDate.replaceAll('-','');
		};

		const data = images
			.map((item) => ({
				startdate: getChinaDate(item.fullstartdate),
				copyright: item.copyright,
				urlbase: item.urlbase,
				title: item.title,
			}))
			.filter((item) => !result.find(({ startdate }) => item.startdate === startdate));

		console.log('data: ', data);

		result.push(...data);
		result.sort((a, b) => b.startdate - a.startdate);
		fs.writeFileSync(dataFilePath, JSON.stringify(result), 'utf8');

		return result[0];
	})
	.then((image) => {
		const BASE_URL = 'https://www.bing.com';
		const imgPath = `${image.urlbase}_1920x1200.jpg&w=1280`;
		const url = `${BASE_URL}${imgPath}`;
		console.log('url: ', url);
		const jpg_name = `${image.startdate}${image.title}.jpg`;
		const jpg_path = `./dist/${jpg_name}`;
		console.log('jpg_path: ', jpg_path);
		fetch(url).then((rsp) => {
			rsp.body.pipe(fs.createWriteStream(jpg_path));
			fs.writeFileSync('./dist/img.json', JSON.stringify({img: jpg_name}), 'utf8');
		});
	});
