module.exports = {
	options: {
		template: 'test/index.template.html',
		runner: 'test/index.html',
		files: 'test/spec/**/*.js'
	},
	coverage: {
		options: {
			baseUrl: 'src'
		}
	},
	travis: {
		options: {
			baseUrl: '../lib'
		}
	}
};
