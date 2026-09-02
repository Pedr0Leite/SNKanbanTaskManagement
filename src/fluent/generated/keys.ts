import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'app.css': {
                        table: 'sys_ux_theme_asset'
                        id: '99e0b76fe8ad4c258ea4c384a5da3df9'
                    }
                    'board-demo': {
                        table: 'x_335329_sn_ktm_board'
                        id: '27af95480b144ec0b00f4524422962f4'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: '9f3a80023e5849ee8f403c64ac5e40b9'
                    }
                    'br-validate-board': {
                        table: 'sys_script'
                        id: 'c1ce1ebf8d434e968b939d96436d8b27'
                    }
                    'cat-accent': {
                        table: 'sys_properties_category_m2m'
                        id: '580e331e2a074ff69eb36e0afbe70715'
                    }
                    'cat-accent-dark': {
                        table: 'sys_properties_category_m2m'
                        id: 'ae1a528052a1483daafdf8935431f56c'
                    }
                    'cat-default-theme': {
                        table: 'sys_properties_category_m2m'
                        id: 'a2a372437044422399a20e016bda6287'
                    }
                    'cat-density': {
                        table: 'sys_properties_category_m2m'
                        id: 'dcb8e2032c8c4e0f9e7527b1fcadfdc3'
                    }
                    'cat-lane-width': {
                        table: 'sys_properties_category_m2m'
                        id: 'c244f168c489481a85ac201483099c00'
                    }
                    'cat-refresh': {
                        table: 'sys_properties_category_m2m'
                        id: '7fe2af0615bc4975b8d2018867207452'
                    }
                    'cat-show-table-chip': {
                        table: 'sys_properties_category_m2m'
                        id: 'd42782da997b4f4a941dff4e24c2ab60'
                    }
                    'cat-title': {
                        table: 'sys_properties_category_m2m'
                        id: 'c97e08fa19894240a12eb67d3d03dc12'
                    }
                    'fld-assigned': {
                        table: 'x_335329_sn_ktm_field'
                        id: '30dfa81eefa54c80949304100e7cd31b'
                    }
                    'fld-caller': {
                        table: 'x_335329_sn_ktm_field'
                        id: '8e39e3ef3a2d4c0898db9d272c96cccb'
                    }
                    'fld-category': {
                        table: 'x_335329_sn_ktm_field'
                        id: '5769cf77c425409f9b7234fd23d31c86'
                    }
                    'fld-description': {
                        table: 'x_335329_sn_ktm_field'
                        id: 'b34d6c0df2f04073b90f53eaac7dc58f'
                    }
                    'fld-opened': {
                        table: 'x_335329_sn_ktm_field'
                        id: '346686e4a3e54976ae30e9f8f06024be'
                    }
                    'fld-priority': {
                        table: 'x_335329_sn_ktm_field'
                        id: '2d2178831f6646a49dd5558bbdafbc02'
                    }
                    'kanban-probe': {
                        table: 'sys_script_fix'
                        id: 'a3cabb9ae23f4e82a303da49c8f757c7'
                        deleted: true
                    }
                    'kanban-verify': {
                        table: 'sys_script_fix'
                        id: '445856e6a3484bf4ae821a43e7751255'
                    }
                    'lane-cancelled': {
                        table: 'x_335329_sn_ktm_lane'
                        id: 'e4ca2258b33c4074bc6941af6d15a048'
                    }
                    'lane-closed': {
                        table: 'x_335329_sn_ktm_lane'
                        id: 'b5d0769539be4b2a9c262ef899372cc2'
                    }
                    'lane-hold': {
                        table: 'x_335329_sn_ktm_lane'
                        id: '3f9d5c20d5874662b7b878c332fb8a67'
                    }
                    'lane-new': {
                        table: 'x_335329_sn_ktm_lane'
                        id: '63531e4f1c264b86b5f1d307d894a11e'
                    }
                    'lane-progress': {
                        table: 'x_335329_sn_ktm_lane'
                        id: 'c301cf671c6c46f5b8af3e510766c89c'
                    }
                    'lane-resolved': {
                        table: 'x_335329_sn_ktm_lane'
                        id: 'b2faee97d4f349f88383e0ea78e51824'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'b0b46077082b465596f0879dc25fc475'
                    }
                    'prop-accent': {
                        table: 'sys_properties'
                        id: '07a804e2ed1e47238ffc2be1677919c7'
                    }
                    'prop-accent-dark': {
                        table: 'sys_properties'
                        id: '3f599557b9ac49fbb5316dd38ae4f9c4'
                    }
                    'prop-category': {
                        table: 'sys_properties_category'
                        id: '159a546d0a0f4331ab93ef1bb322d391'
                    }
                    'prop-default-theme': {
                        table: 'sys_properties'
                        id: 'd1714e5047bb48b99ed3b0bca07e4917'
                    }
                    'prop-density': {
                        table: 'sys_properties'
                        id: '46c60fb3ff864ba49261490811c75426'
                    }
                    'prop-lane-width': {
                        table: 'sys_properties'
                        id: 'cb3210b2462546b78f1b7e599eae4cac'
                    }
                    'prop-refresh': {
                        table: 'sys_properties'
                        id: 'a51ede838cb043b890901a53ad6a9320'
                    }
                    'prop-show-table-chip': {
                        table: 'sys_properties'
                        id: 'ef12c6654922431ba98f339fe49ca75f'
                    }
                    'prop-title': {
                        table: 'sys_properties'
                        id: 'f5d1af5bd9584e309667853626897b9c'
                    }
                    'rest-kanban': {
                        table: 'sys_ws_definition'
                        id: 'e7c482e54c88413e8236edddd55cbff4'
                    }
                    'rest-kanban-v1': {
                        table: 'sys_ws_version'
                        id: '4201ad84169f427b865bdc1cf6184707'
                    }
                    'route-board': {
                        table: 'sys_ws_operation'
                        id: '369ac373aade485da72fd89ad6dfccbc'
                    }
                    'route-boards': {
                        table: 'sys_ws_operation'
                        id: 'e5ee88760b00419e8f8e09326f695f57'
                    }
                    'route-cards': {
                        table: 'sys_ws_operation'
                        id: 'a512cecd4731403693a148b66bb42353'
                    }
                    'route-create-board': {
                        table: 'sys_ws_operation'
                        id: '12e012d5a0b34405a35d5931a4731eb2'
                    }
                    'route-fields': {
                        table: 'sys_ws_operation'
                        id: 'b1fee19be926416d9a88249bc2b43573'
                    }
                    'route-journal': {
                        table: 'sys_ws_operation'
                        id: 'fa542d1382af40988f2b4ca4aa5852f5'
                    }
                    'route-journal-page': {
                        table: 'sys_ws_operation'
                        id: '7aad58d0849a42e59cd12bd2088e59a5'
                    }
                    'route-lane': {
                        table: 'sys_ws_operation'
                        id: '06e37f700a24415a9607561952b6a934'
                    }
                    'route-prefs-get': {
                        table: 'sys_ws_operation'
                        id: 'f56921011340486b961c292361f6c0ac'
                    }
                    'route-prefs-put': {
                        table: 'sys_ws_operation'
                        id: 'e11b2cb04f9148ea9b1a1850a8bac7f3'
                    }
                    'route-record': {
                        table: 'sys_ws_operation'
                        id: '937a4d862d494163a0948a127c3c2a93'
                    }
                    'route-settings': {
                        table: 'sys_ws_operation'
                        id: '1f07c1bb69684485bf3a32e4cbf5b469'
                    }
                    'route-tables': {
                        table: 'sys_ws_operation'
                        id: 'c0ca9a76c09248629891726aab1fefda'
                    }
                    'si-admin-service': {
                        table: 'sys_script_include'
                        id: '3484d22003e4443c93a2c57249eeb0c3'
                    }
                    'si-api': {
                        table: 'sys_script_include'
                        id: 'd175bbaebd0b45909ce079ea6741caa7'
                    }
                    'si-board-service': {
                        table: 'sys_script_include'
                        id: '9d68ae46b67f4929b15d1c359f22a96f'
                    }
                    'si-choice-util': {
                        table: 'sys_script_include'
                        id: 'cc271538b7e14fab84c8a06fa06fa028'
                    }
                    'si-record-service': {
                        table: 'sys_script_include'
                        id: 'bd93858917b841a4ac6a1e60ee663595'
                    }
                    src_server_KanbanAdminService_js: {
                        table: 'sys_module'
                        id: 'e3cd6cd044e347ac995d9ee5adbf9c23'
                    }
                    src_server_KanbanApi_js: {
                        table: 'sys_module'
                        id: '5c7c3dcb9902490c9c6e75405aede2dc'
                    }
                    src_server_KanbanBoardService_js: {
                        table: 'sys_module'
                        id: 'd4a9f1461efb4c6c9085ab35e2680214'
                    }
                    src_server_KanbanChoiceUtil_js: {
                        table: 'sys_module'
                        id: '176bea3651784d2b8f5a6099dcd92d6d'
                    }
                    src_server_KanbanRecordService_js: {
                        table: 'sys_module'
                        id: 'a35b2b4efd094ea9abe6f53acf78ef39'
                    }
                    'xs-api-properties': {
                        table: 'sys_scope_privilege'
                        id: '01a5b6df3099460eb9af596f7e485593'
                    }
                    'xs-api-string-utils': {
                        table: 'sys_scope_privilege'
                        id: '1a81471948e64cb7b558c36dba635952'
                    }
                    'xs-api-table-metadata': {
                        table: 'sys_scope_privilege'
                        id: 'c3d2c5434ca74024b9192aeb9a888463'
                    }
                    'xs-gr-setvalue': {
                        table: 'sys_scope_privilege'
                        id: '95abd519f61141aea138be691277b4f0'
                    }
                    'xs-gr-update': {
                        table: 'sys_scope_privilege'
                        id: '8886431ff68042ebb03b8cc9cd0c1501'
                    }
                    'xs-grs-addencodedquery': {
                        table: 'sys_scope_privilege'
                        id: '039e5071802f4dbbbdfe2a56a63dfcb5'
                    }
                    'xs-grs-getvalue': {
                        table: 'sys_scope_privilege'
                        id: 'f1682923de45429b849c077c813056b0'
                    }
                    'xs-grs-orderby': {
                        table: 'sys_scope_privilege'
                        id: '3e46190c87c04e859a2313a3dd256bb4'
                    }
                    'xs-incident-read': {
                        table: 'sys_scope_privilege'
                        id: '246144b2d4a4462d9cf7adbe15665db6'
                    }
                    'xs-incident-write': {
                        table: 'sys_scope_privilege'
                        id: '981ded0c39954577be1b575c0f64d367'
                    }
                    'xs-result-setbody': {
                        table: 'sys_scope_privilege'
                        id: '3ab55bc67f4e45b8940ec50fe05076db'
                    }
                    'xs-result-setstatus': {
                        table: 'sys_scope_privilege'
                        id: '534e28893181496bab6ae105af7584ad'
                    }
                    'xs-sys-choice-read': {
                        table: 'sys_scope_privilege'
                        id: '6a6fe29ba4a04138a51883ea5a4c8708'
                    }
                    'xs-sys-db-object-read': {
                        table: 'sys_scope_privilege'
                        id: '7325cc5f18594c72bbeb173fc650af46'
                    }
                    'xs-sys-dictionary-read': {
                        table: 'sys_scope_privilege'
                        id: 'c2bbbdc9b14a463288f633e140b84c8d'
                    }
                    'xs-sys-journal-read': {
                        table: 'sys_scope_privilege'
                        id: '2be4c1ac365d4b9aa15cf764f74fe461'
                    }
                    'xs-sys-user-read': {
                        table: 'sys_scope_privilege'
                        id: '4a29746a6b5c4ac5bd8b6478f0ec6e71'
                    }
                    'xs-sys-user-role-read': {
                        table: 'sys_scope_privilege'
                        id: '1722c9c7b8e4400a8704e779bc232675'
                    }
                    'xs-task-read': {
                        table: 'sys_scope_privilege'
                        id: '22b3f831dc5044a0b21bcb0b429bfb3e'
                    }
                    'xs-task-write': {
                        table: 'sys_scope_privilege'
                        id: 'a9d66873842e48579a443ca2706d5c63'
                    }
                }
                composite: [
                    {
                        table: 'sys_documentation'
                        id: '03c88ed87ba84fe092d93b8bef91debf'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'board'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '05cdec53357c4095876534398989bffc'
                        key: {
                            logical_table_name: 'x_335329_sn_ktm_board'
                            col_name_string: 'active,order'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0883415bd3cb46e28253d97f2fb1eded'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'allow_journal_choice'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '093c1877c52c4929b7953ef46c482519'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'display_as'
                            value: 'text'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0cdcf429d56e4883a59e2e052771a804'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'order'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0f6a8461428c4bc69efcd2c6ad891238'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'filter'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '10aef24260b9411ba9120a0cd7c26e58'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'label_override'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '118688b1a8fd4303a4bb0028331460b6'
                        key: {
                            name: 'x_335329_sn_ktm.kanban_admin'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '16ed25ba7d774ca5ac6f4e11898b5929'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'board'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '170dda6b5f3e4aa782da561c8ef314bc'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'table'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '17d20289fcf448e48b8b0be70edf70c9'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'value'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '1fb16534ad52409f93a3f7069e0e5dc3'
                        key: {
                            application_file: '92690c0e567a4a558493440407ea3c79'
                            source_artifact: 'efee9224d8f748f288c7fd035c4bf280'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '20c27a743e79485ab6e0389f27d1e652'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'allow_journal_choice'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '216dd08c424449239132faf2819b1e0f'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'value'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2215faf8ddc34374a78a668ef7f8638c'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'order'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '296a1ca42bb34568b07a0b4405853326'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'show_in_modal'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2b27d33c8bf24303b1c18345f3712a5d'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'board'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '2d626b179d96423db6fa5555828c0389'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'display_as'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '30ba744159d54c9691fced25fef5599e'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3efbe65ad32e49baa5ae541173ab47ba'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'hidden'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3efde37fcb654daf8832273594d6af1f'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'roles'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4533fc3335fe4851ae0e1fb8ade70d6a'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'display_as'
                            value: 'link'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '459e5df6d1ab470284cb56677ad4ed4a'
                        deleted: true
                        key: {
                            application_file: '92690c0e567a4a558493440407ea3c79'
                            source_artifact: 'dbc059d3d3c64e87823593f6683405a4'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '47796b7129904ad8b4d94ffdbec16319'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '47f667f080434fb68dd59b412cc85fc2'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'element'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '492cbe1e57d348959179a6b17957bda0'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'card_subtitle_field'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '4b755760d61e48cfba7d84e308c62ad4'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4d99cc5805e842dabb8951dc6aac2472'
                        key: {
                            name: 'x_335329_sn_ktm/main'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '521397d1b40541f2acb4fda5555903ce'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'card_title_field'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '547cd683b92049929a47beb90511038a'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'display_as'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5870206178534076ad8cd201c3cb2b4f'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '5c1f494ce4094af4b925255a0d9092d4'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5c3a0c1a30254ed0951045d06ad50fed'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'accent_colour'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5f533d92f5424db39d85229d1b1df738'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '605f241cc97343b9b48c667144f52b0f'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'order'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '626f4af497e64d669a7364facfd12fec'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'journal_field'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '65df0bcb6a2b42afbbb8a870d6268b4f'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '68107d1b354142f59a35083d9d21f5d1'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'display_as'
                            value: 'badge'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '689eb1ef9e2d4a4dba1dcdb66cc41161'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'show_on_card'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7276a11ccccc494e8edb4c117cebfd4c'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'display_as'
                            value: 'avatar'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '728cdd1439c247519709c9daa4801f86'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '74af50221cd8468d90deef5bdff07b8d'
                        deleted: true
                        key: {
                            application_file: '4d99cc5805e842dabb8951dc6aac2472'
                            source_artifact: 'dbc059d3d3c64e87823593f6683405a4'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '81e75df8d8c043908548fa1f08fc1cc0'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'max_records'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '88c20b99340048bb9ac282014630c2e8'
                        key: {
                            logical_table_name: 'x_335329_sn_ktm_field'
                            col_name_string: 'board,order'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8ac0130b07c744d2be9bb65855619baa'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'hidden'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8e7fe339ede24c5c9a4e34645c5aaed2'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'max_records'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '91a34d931505496894ff31e9493ca539'
                        key: {
                            application_file: '4d99cc5805e842dabb8951dc6aac2472'
                            source_artifact: 'efee9224d8f748f288c7fd035c4bf280'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '92690c0e567a4a558493440407ea3c79'
                        key: {
                            name: 'x_335329_sn_ktm/main.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '93cc4ad0ee9c46eeb69c7bce930d156d'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'show_on_card'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9a4ef8dce05f45eeb1ba4af69d22e0ef'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'order'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9aa740ead5984be8807d2a45ec017ebc'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'roles'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '9cbe93a3604f4067b4a231cdb3be678d'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'a0df56d0cd824fe6b57045283675ce3f'
                        key: {
                            logical_table_name: 'x_335329_sn_ktm_lane'
                            col_name_string: 'board,value'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a0e23937ae0040ef96bcb849024a52b7'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'a4fc2d592d4947fdaa32bb979c1196c4'
                        deleted: true
                        key: {
                            application_file: 'df814962fa0b40cc80e6d26a09cf7205'
                            source_artifact: 'dbc059d3d3c64e87823593f6683405a4'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a6118bd6d78b4bd0a34446bd31886dc8'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'lane_field'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bdbc91adf6ce40ffab23fdbd4b35f7a1'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bdc160d6b1684440b57da70c0bc5b390'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'filter'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bddf079794a247d2802c4632be416073'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bffba120a2394b198b06e95934ee1659'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'card_subtitle_field'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c1e44c5c499b4d0e9081ddf20bbbade1'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'wip_limit'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c2eedf903d7a43e780a7df22fcecb1f1'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'board'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c403c526e651401ba30e7a3c5b33399e'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'display_as'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c7919b7088204e55a8470f482e0f367e'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'lane_field'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: 'ca7d7bbaf62943f68cdf059a81557e9d'
                        key: {
                            endpoint: 'x_335329_sn_ktm_kanban.do'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cc1b9212f7d745cb9ba71c2485fe8373'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cd23e4ef7f034e0896a20d6fb31b2b50'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'order'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cd471943beca4d9591e4ad628285c6d3'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cdc7687a2aea4f019dd10f8245958a87'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'order'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd06828a176054417a0b332f99a591fbc'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'element'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd56b7b196f0c44fbbe1ae3932b23d8df'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'label_override'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd6550d763b47428aacc0d6fb1ebc7216'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'label_override'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'd6ba8aad3fee4f5eae36e7a1bd60f297'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: 'dbc059d3d3c64e87823593f6683405a4'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_ktm_incident_manager.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: 'df814962fa0b40cc80e6d26a09cf7205'
                        deleted: true
                        key: {
                            endpoint: 'x_335329_sn_ktm_incident_manager.do'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e285602316fd4d46957314f41a16acc3'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'e3ac86b8cbe6436dbc8d1fdab952b64e'
                        key: {
                            application_file: 'ca7d7bbaf62943f68cdf059a81557e9d'
                            source_artifact: 'efee9224d8f748f288c7fd035c4bf280'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e9f50d861ed7478d93f566545254e0e7'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'display_as'
                            value: 'date'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ea46cce1debd4412acceb9d8abd8141e'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'wip_limit'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'eb9bdf523b8845399dfdccd34ed583b5'
                        key: {
                            name: 'x_335329_sn_ktm_field'
                            element: 'show_in_modal'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: 'efee9224d8f748f288c7fd035c4bf280'
                        key: {
                            name: 'x_335329_sn_ktm_kanban.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f11726e971334a4e95442eded23c9fe7'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'card_title_field'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f15f23a6c5c04defa772c2cfec95ab5e'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'accent_colour'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f4a3d18eb1ad42089997c26639003ac2'
                        key: {
                            name: 'x_335329_sn_ktm_lane'
                            element: 'label_override'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f8ee0020c9e5415796a5007e3d7e5cbc'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'table'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fb4aa98d7660469a98100dd1e2ca79de'
                        key: {
                            name: 'x_335329_sn_ktm_board'
                            element: 'journal_field'
                            language: 'en'
                        }
                    },
                ]
            }
        }
    }
}
