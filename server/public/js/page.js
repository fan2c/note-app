var PageUnitTests = {};
(function() {
    PageUnitTests.tests = {
        _createOrUpdateListingForNote: function(cbk) {
            var getListingById = function(id) {
                return Page._noteListingElementsById({
                    id: id
                })[0];
            };
            var note = {
                id: "test_note",
                text: "string",
                text_last_modified: new Date().toISOString()
            };
            var confirmListingModified = function(listing, go_on) {
                if (!listing) {
                    return go_on([0, "Expected listing"]);
                }
                var expectedText = Page.titleFromNoteText({
                    text: note.text
                });
                var titleText = $(listing).find(".title").text();
                if (titleText !== expectedText) {
                    return go_on([0, "Expected note title"]);
                }
                if ($(listing).data("id") !== note.id) {
                    return go_on([0, "Expected note id data"]);
                }
                if ($(listing).data("lm") !== note.text_last_modified) {
                    return go_on([0, "Expected note last modified data"]);
                }
                go_on();
            };
            async.auto({
                addNote: function(go_on) {
                    Data.addNote({
                        id: note.id,
                        text: note.text
                    }, go_on);
                },
                addListing: ["addNote", function(go_on, res) {
                    Page._createOrUpdateListingForNote({
                        id: note.id
                    }, go_on);
                }],
                confirmAddListing: ["addListing", function(go_on, res) {
                    confirmListingModified(getListingById(note.id), go_on);
                }],
                updateNote: ["confirmAddListing", function(go_on, res) {
                    note.text = "string_modified";
                    Data.editNote({
                        id: note.id,
                        text: note.text
                    }, go_on);
                }],
                updateListing: ["updateNote", function(go_on, res) {
                    var updated = res.updateNote;
                    note.text_last_modified = updated.text_last_modified;
                    Page._createOrUpdateListingForNote({
                        id: note.id
                    }, go_on);
                }],
                confirmUpdateListing: ["updateListing", function(go_on, res) {
                    confirmListingModified(getListingById(note.id), go_on);
                }],
                cleanUp: ["confirmUpdateListing", function(go_on, res) {
                    getListingById(note.id).remove();
                    Db.removeRow({
                        key: note.id,
                        store: "notes"
                    }, go_on);
                }]
            }, cbk);
        },
        _noteTime: function(cbk) {
            Page._noteTime({
                text: "string",
                text_last_modified: new Date().toISOString()
            });
            if (!$("#metadata .date .value").text()) {
                return cbk([0, "Expected date showing"]);
            }
            Page._noteTime({
                text: "",
                text_last_modified: new Date().toISOString()
            });
            if (!!$("#metadata .date .value").text()) {
                return cbk([0, "Expected no date showing"]);
            }
            cbk();
        },
        _showSearchResults: function(cbk) {
            var notes = [{
                id: "empty",
                text: ""
            }, {
                id: "hit",
                text: "search_hit"
            }, {
                id: "miss",
                text: "search_miss"
            }];
            async.auto({
                addNotes: function(go_on) {
                    async.eachSeries(notes, function(n, next) {
                        Data.addNote({
                            id: n.id,
                            text: n.text
                        }, function(err) {
                            if (!!err) {
                                return next(err);
                            }
                            Page._createOrUpdateListingForNote({
                                id: n.id
                            }, next);
                        });
                    }, go_on);
                },
                hideSearchMisses: ["addNotes", function(go_on, res) {
                    Page._showSearchResults({
                        notes: [notes[1]]
                    }, go_on);
                }],
                confirmHidden: ["hideSearchMisses", function(go_on, res) {
                    var empty = Page._noteListingElementsById({
                        id: "empty"
                    });
                    var hit = Page._noteListingElementsById({
                        id: "hit"
                    });
                    var miss = Page._noteListingElementsById({
                        id: "miss"
                    });
                    if (empty.hasClass("searchMiss")) {
                        return go_on([0, "Expected empty is not a miss"]);
                    }
                    if (hit.hasClass("searchMiss")) {
                        return go_on([0, "Expected search hit is not a miss"]);
                    }
                    if (!miss.hasClass("searchMiss")) {
                        return go_on([0, "Expected search miss is a miss"]);
                    }
                    go_on();
                }],
                cleanup: ["confirmHidden", function(go_on, res) {
                    $("#stacks .stack").remove();
                    async.eachSeries(notes, function(n, removed) {
                        Db.removeRow({
                            key: n.id,
                            store: "notes"
                        }, removed);
                    }, go_on);
                }],
                reset: ["cleanup", function(go_on, res) {
                    Page.addNewNote({}, go_on);
                }]
            }, cbk);
        },
        addNewNote: function(cbk) {
            async.auto({
                enableSearch: function(go_on) {
                    Page.toggleSearchMode({}, go_on);
                },
                addNote: ["enableSearch", function(go_on, res) {
                    Page.addNewNote({}, go_on);
                }],
                confirmNoteAdded: ["addNote", function(go_on, res) {
                    var searchHidden = !$("#search").is(".active");
                    if (!searchHidden) {
                        return go_on([0, "Expected search is hidden"]);
                    }
                    go_on();
                }]
            }, cbk);
        },
        addRemoteSyncInfoNote: function(cbk) {
            async.auto({
                addDropboxInfo: function(go_on) {
                    Page.addRemoteSyncInfoNote({
                        service: "dropbox"
                    }, go_on);
                },
                addGoogleInfo: ["addDropboxInfo", function(go_on, res) {
                    Page.addRemoteSyncInfoNote({
                        service: "google"
                    }, go_on);
                }],
                cleanGoogle: ["addGoogleInfo", function(go_on, res) {
                    Page.removeSelectedNoteListing({}, go_on);
                }],
                cleanDropbox: ["cleanGoogle", function(go_on, res) {
                    Page.removeSelectedNoteListing({}, go_on);
                }]
            }, cbk);
        },
        getNoteText: function(cbk) {
            async.auto({
                setNoteText: function(go_on) {
                    var notes = $("#notes");
                    notes.html("");
                    ["text", "<br>", "<a href=\"http://example.co\">http://example.co</a>", "<br>"].forEach(function(n) {
                        $(notes).append(n);
                    });
                    var expectedHtml = "text\nhttp://example.co";
                    if (Page.getNoteText({}) !== expectedHtml) {
                        return go_on([0, "Expected text of html"]);
                    }
                    return go_on();
                },
                cleanUp: ["setNoteText", function(go_on, res) {
                    $("#notes").text("").html("");
                    return go_on();
                }]
            }, cbk);
        },
        searchNotes: function(cbk) {
            var notes = ["a", "b", "c"];
            var visible = function() {
                return $("#stacks .stack:visible");
            };
            async.auto({
                addNotes: function(go_on) {
                    async.eachSeries(notes, function(text, added) {
                        Page.addNewNote({
                            text: text
                        }, added);
                    }, go_on);
                },
                toggleSearch: ["addNotes", function(go_on, res) {
                    Page.toggleSearchMode({}, go_on);
                }],
                searchNotes: ["addNotes", function(go_on, res) {
                    $("#search input").val(notes[1]);
                    Page.searchNotes({
                        q: notes[1]
                    }, go_on);
                }],
                confirmNotesFiltered: ["searchNotes", function(go_on, res) {
                    if (visible().length !== [notes[1]].length) {
                        go_on([0, "Expected search filtering"]);
                    }
                    go_on();
                }],
                hideSearch: ["confirmNotesFiltered", function(go_on, res) {
                    Page.hideSearch({}, go_on);
                }],
                confirmSearchCleared: ["hideSearch", function(go_on, res) {
                    if (visible().length !== notes.length) {
                        go_on([0, "Expected search filtering"]);
                    }
                    go_on();
                }],
                cleanNotes: ["confirmSearchCleared", function(go_on, res) {
                    async.eachSeries(notes, function(n, removed) {
                        Page.removeSelectedNoteListing({}, removed);
                    }, go_on);
                }]
            }, cbk);
        },
        selectNoteListing: function(cbk) {
            async.auto({
                notes: async.constant(["a", "b"]),
                addNotes: ["notes", function(go_on, res) {
                    async.eachSeries(res.notes, function(text, added) {
                        Page.addNewNote({
                            text: text
                        }, added);
                    }, go_on);
                }],
                addEmpty: ["addNotes", function(go_on, res) {
                    Page.addNewNote({}, go_on);
                }],
                selectA: ["addEmpty", function(go_on, res) {
                    var node = $("#stacks .stack").eq(2);
                    Page.selectNoteListing({
                        node: node
                    }, go_on);
                }],
                delayToCleanUpEmptyNote: ["selectA", function(go_on, res) {
                    _(go_on).delay(300);
                }],
                confirmASelected: ["delayToCleanUpEmptyNote", "notes", function(go_on, res) {
                    var visibleListings = $("#stacks .stack:visible");
                    if (visibleListings.length !== res.notes.length) {
                        return go_on([0, "Expected empty note eliminated"]);
                    }
                    if (Page.getNoteText({}) !== res.notes[0]) {
                        return go_on([0, "Expected note text showing"]);
                    }
                    if (!visibleListings.eq(1).hasClass("selected")) {
                        return go_on([0, "Expected note selected"]);
                    }
                    go_on();
                }],
                eliminateNotes: ["confirmASelected", "notes", function(go_on, res) {
                    async.eachSeries(res.notes, function(n, removed) {
                        Page.removeSelectedNoteListing({}, removed);
                    }, go_on);
                }]
            }, cbk);
        },
        setAuthError: function(cbk) {
            var assertErrorMessageShowing = function() {
                var errorIsVisible = $(".error_message").is(":visible");
                Page.resetError({});
                if (errorIsVisible) {
                    return true;
                }
                cbk([0, "Expected error message showing"]);
                return false;
            };
            Page.setAuthError({
                code: "missing_email"
            });
            if (!assertErrorMessageShowing) {
                return;
            }
            Page.setAuthError({
                code: "missing_password"
            });
            if (!assertErrorMessageShowing) {
                return;
            }
            Page.setAuthError({
                code: "invalid_email"
            });
            if (!assertErrorMessageShowing) {
                return;
            }
            Page.resetError({});
            cbk();
        },
        setFontSize: function(cbk) {
            Page.setFontSize({
                size: 2
            });
            if (!$("#paper").hasClass("size2")) {
                return cbk([0, "Expected increased size"]);
            }
            Page.setFontSize({
                size: 0
            });
            if ($("#paper").hasClass("size2")) {
                return cbk([0, "Expected normal size"]);
            }
            cbk();
        },
        setStyle: function(cbk) {
            Page.setStyle({
                style: "handwriting"
            });
            if ($("#paper").hasClass("standard")) {
                return cbk([0, "Expected handwriting font"]);
            }
            Page.setStyle({
                style: "standard"
            });
            if ($("#paper").hasClass("handwriting")) {
                return cbk([0, "Expected standard font"]);
            }
            cbk();
        },
        showFatalStartError: function(cbk) {
            var errorMessage = $("#existing .toast");
            if (!Db.isReady({}) && !errorMessage.length) {
                return cbk([0, "Expected error message about database"]);
            }
            if (Db.isReady({}) && !!errorMessage.length) {
                return cbk([0, "Expected to not show any error message"]);
            }
            cbk();
        },
        showTrashConfirmationForSelectedNote: function(cbk) {
            async.auto({
                addNote: function(go_on) {
                    Page.addNewNote({
                        text: "string"
                    }, go_on);
                },
                createEmpty: ["addNote", function(go_on, res) {
                    Page.addNewNote({}, go_on);
                }],
                trashEmpty: ["createEmpty", function(go_on, res) {
                    if ($("#stacks .stack:visible").length !== 2) {
                        return go_on([0, "Expected empty note listing"]);
                    }
                    Page.showTrashConfirmationForSelectedNote({});
                    _(go_on).delay(250);
                }],
                confirmRemovedEmpty: ["trashEmpty", function(go_on, res) {
                    if ($("#stacks .stack:visible").length !== 1) {
                        return go_on([0, "Expected empty note listing"]);
                    }
                    go_on();
                }],
                showTrash: ["confirmRemovedEmpty", function(go_on, res) {
                    Page.showTrashConfirmationForSelectedNote({});
                    if (!$("#stacks .confirm").length) {
                        return go_on([0, "Expected confirm button"]);
                    }
                    $("#stacks .confirm").click();
                    _(go_on).delay(200);
                }],
                confirmTrashed: ["showTrash", function(go_on, res) {
                    if (!Page._selectedNoteListing({}).is(".empty")) {
                        return go_on([0, "Expected note trashed"]);
                    }
                    go_on();
                }]
            }, cbk);
        },
        titleFromNoteText: function(cbk) {
            async.auto({
                leadingSpacesTrimmed: function(go_on) {
                    var title = Page.titleFromNoteText({
                        text: "  \n\nstring"
                    });
                    if (title !== "string") {
                        return go_on([0, "Expected title"]);
                    }
                    go_on();
                },
                emptyGivenTitle: function(go_on) {
                    var title = Page.titleFromNoteText({
                        text: "  \n\n"
                    });
                    if (title !== "New Note") {
                        return go_on([0, "Expected title"]);
                    }
                    go_on();
                }
            }, cbk);
        }
    };
})();
