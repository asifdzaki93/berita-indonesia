import {
    IExecuteFunctions,
    ILoadOptionsFunctions,
    INodeExecutionData,
    INodePropertyOptions,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';

export class BeritaIndonesia implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Berita Indonesia',
        name: 'beritaIndonesia',
        icon: 'file:berita-indonesia.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
        description: 'Get latest news from various Indonesian media',
        defaults: {
            name: 'Berita Indonesia',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'https://berita-indonesia.vercel.app',
                required: true,
                description: 'The URL where the Berita Indonesia API is hosted',
            },
            {
                displayName: 'Media',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                typeOptions: {
                    loadOptionsMethod: 'getMedia',
                },
                default: '',
                required: true,
                description: 'Select the news media to fetch from',
            },
            {
                displayName: 'Category',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                typeOptions: {
                    loadOptionsMethod: 'getCategories',
                    loadOptionsDependsOn: ['resource'],
                },
                default: '',
                required: true,
                description: 'Select the news category',
            },
        ],
    };

    methods = {
        loadOptions: {
            async getMedia(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
                const baseUrl = this.getNodeParameter('baseUrl') as string;
                try {
                    const responseData = await this.helpers.request({
                        method: 'GET',
                        uri: baseUrl,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        },
                        json: true,
                    });

                    if (!responseData.endpoints) {
                        throw new Error('Could not find endpoints in API response');
                    }

                    const options: INodePropertyOptions[] = responseData.endpoints.map((endpoint: any) => ({
                        name: endpoint.name.charAt(0).toUpperCase() + endpoint.name.slice(1),
                        value: endpoint.name,
                    }));

                    options.unshift({ name: 'All (Semua Media)', value: 'all' });

                    return options;
                } catch (error) {
                    throw new NodeOperationError(this.getNode(), error as Error);
                }
            },

            async getCategories(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
                const baseUrl = this.getNodeParameter('baseUrl') as string;
                const resource = this.getNodeParameter('resource') as string;

                if (resource === 'all') {
                    return [{ name: 'Fetch All Latest', value: 'all' }];
                }

                try {
                    const responseData = await this.helpers.request({
                        method: 'GET',
                        uri: baseUrl,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        },
                        json: true,
                    });

                    const endpoint = responseData.endpoints.find((e: any) => e.name === resource);

                    if (!endpoint || !endpoint.paths) {
                        return [];
                    }

                    return endpoint.paths.map((p: any) => ({
                        name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
                        value: p.name,
                    }));
                } catch (error) {
                    throw new NodeOperationError(this.getNode(), error as Error);
                }
            },
        },
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        const baseUrl = this.getNodeParameter('baseUrl', 0) as string;

        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i) as string;
                const operation = this.getNodeParameter('operation', i) as string;

                let uri = '';
                if (resource === 'all') {
                    uri = `${baseUrl.replace(/\/$/, '')}/all`;
                } else {
                    uri = `${baseUrl.replace(/\/$/, '')}/${resource}/${operation}`;
                }

                const responseData = await this.helpers.request({
                    method: 'GET',
                    uri,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                    json: true,
                });

                const data = Array.isArray(responseData.data) ? responseData.data : [responseData.data || responseData];

                const executionData = this.helpers.returnJsonArray(data);

                for (const item of executionData) {
                    item.pairedItem = { item: i };
                    returnData.push(item);
                }
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: (error as Error).message },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw new NodeOperationError(this.getNode(), error as Error, {
                    itemIndex: i,
                });
            }
        }

        return [returnData];
    }
}
