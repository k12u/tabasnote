import React, { useState, useEffect } from 'react'
import { Button } from "./components/ui/button"
import { Textarea } from "./components/ui/textarea"
import { Archive, FileIcon, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

type File = {
    id: string
    name: string
    content: string
    archived: boolean
}

const getFilePreview = (content: string, maxLength: number = 30) => {
    const trimmed = content.trim().replace(/\s+/g, ' ');
    return trimmed.length > maxLength ? trimmed.slice(0, maxLength) + '...' : trimmed;
};

export default function App() {
    const [files, setFiles] = useState<File[]>([])
    const [currentFile, setCurrentFile] = useState<File | null>(null)
    const [showArchived, setShowArchivedState] = useState(false)

    useEffect(() => {
        chrome.storage.sync.get(['files', 'showArchived'], (result) => {
            if (result.files) {
                setFiles(result.files);
                const urlParams = new URLSearchParams(window.location.search);
                const fileId = urlParams.get('fileId');
                if (fileId) {
                    const file = result.files.find((f: File) => f.id === fileId);
                    if (file) {
                        setCurrentFile(file);
                    }
                }
            }
            if (result.showArchived !== undefined) setShowArchivedState(result.showArchived);
        });
    }, []);

    useEffect(() => {
        chrome.storage.sync.set({ files });
    }, [files]);

    const setShowArchived = (value: boolean) => {
        setShowArchivedState(value);
        chrome.storage.sync.set({ showArchived: value });
    };

    const createNewFile = () => {
        const newFile = {
            id: Date.now().toString(),
            name: `New File ${files.length + 1}`,
            content: '',
            archived: false
        }
        setFiles([...files, newFile])
        setCurrentFile(newFile)
    }

    const updateCurrentFile = (content: string) => {
        if (currentFile) {
            const updatedFile = { ...currentFile, content }
            setCurrentFile(updatedFile)
            setFiles(files.map(f => f.id === updatedFile.id ? updatedFile : f))
        }
    }

    const toggleArchive = (file: File) => {
        const updatedFile = { ...file, archived: !file.archived }
        setFiles(files.map(f => f.id === file.id ? updatedFile : f))
        if (currentFile?.id === file.id) {
            setCurrentFile(updatedFile)
        }
    }

    const deleteFile = (file: File) => {
        if (file.archived) {
            setFiles(files.filter(f => f.id !== file.id))
            if (currentFile?.id === file.id) {
                setCurrentFile(null)
            }
        }
    }

    const openFile = (file: File) => {
        if (file.archived) {
            toggleArchive(file)
        }
        setCurrentFile(file)
        // Update URL without reloading the page
        window.history.pushState(null, '', `?fileId=${file.id}`);
    }

    const openFileInNewTab = (file: File) => {
        chrome.runtime.sendMessage({ action: "openFile", fileId: file.id });
    }

    return (
        <div className="flex h-screen w-full bg-gray-100">
            <div className="flex-1 p-4 bg-white">
                <Textarea
                    className="w-full h-full resize-none border-2 border-gray-300 rounded-md p-2"
                    value={currentFile?.content || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateCurrentFile(e.target.value)}
                    placeholder="Start typing..."
                />
            </div>
            <div className="w-64 bg-gray-200 p-4 flex flex-col">
                <Button onClick={createNewFile} className="mb-4 bg-blue-500 hover:bg-blue-600 text-white">
                    <Plus className="mr-2 h-4 w-4" /> New File
                </Button>
                <div className="flex-1 overflow-y-auto">
                    <h2 className="font-bold mb-2 text-gray-700">Files</h2>
                    {files.filter(f => !f.archived).map(file => (
                        <div key={file.id} className="flex items-center justify-between mb-2">
                            <button
                                className="text-left flex items-center text-blue-600 hover:text-blue-800 truncate"
                                onClick={() => openFile(file)}
                                title={file.name}
                            >
                                <FileIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{getFilePreview(file.content) || 'Empty file'}</span>
                            </button>
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openFileInNewTab(file);
                                    }}
                                    className="text-gray-600 hover:text-gray-800 flex-shrink-0 mr-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleArchive(file);
                                    }}
                                    className="text-gray-600 hover:text-gray-800 flex-shrink-0"
                                >
                                    <Archive className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <Button
                    variant="ghost"
                    onClick={() => setShowArchived(!showArchived)}
                    className="my-2 text-gray-700 hover:text-gray-900"
                >
                    {showArchived ? (
                        <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Hide Archived Files
                        </>
                    ) : (
                        <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Show Archived Files
                        </>
                    )}
                </Button>
                {showArchived && (
                    <div className="flex-1 overflow-y-auto">
                        <h2 className="font-bold mb-2 text-gray-700">Archived Files</h2>
                        {files.filter(f => f.archived).map(file => (
                            <div key={file.id} className="flex items-center justify-between mb-2">
                                <button
                                    className="text-left flex items-center text-blue-600 hover:text-blue-800 truncate"
                                    onClick={() => openFile(file)}
                                    title={file.name}
                                >
                                    <FileIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{getFilePreview(file.content) || 'Empty file'}</span>
                                </button>
                                <div className="flex items-center">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openFileInNewTab(file);
                                        }}
                                        className="text-gray-600 hover:text-gray-800 flex-shrink-0 mr-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteFile(file);
                                        }}
                                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
