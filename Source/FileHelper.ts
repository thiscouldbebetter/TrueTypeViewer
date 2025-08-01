
class FileHelper
{
	static readBytesFromFile(file: any, callback: any): void
	{
		var fileReader = new FileReader();
		fileReader.onloadend = (fileLoadedEvent: any) =>
		{
			if (fileLoadedEvent.target.readyState == FileReader.DONE)
			{
				var bytesFromFile = fileLoadedEvent.target.result;
				callback(bytesFromFile);
			}
		}

		fileReader.readAsBinaryString(file);
	};
}
