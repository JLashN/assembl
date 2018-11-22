# -*- coding=utf-8 -*-
import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

import assembl.graphql.docstrings as docs
from assembl.auth import CrudPermissions
from assembl import models

from .permissions_helpers import require_instance_permission
from .types import SecureObjectType, SQLAlchemyInterface
from .utils import abort_transaction_on_exception


class TagInterface(SQLAlchemyInterface):
    __doc__ = docs.TagInterface.__doc__

    class Meta:
        model = models.Keyword
        only_fields = ()
        # Don't add id in only_fields in an interface
        # will be just the primary key, not the base64 type:id

    value = graphene.String(required=True, description=docs.TagInterface.value)


class Tag(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.TagInterface.__doc__

    class Meta:
        model = models.Keyword
        interfaces = (Node, TagInterface)
        only_fields = ('id', )


class UpdateTag(graphene.Mutation):
    __doc__ = docs.UpdateTag.__doc__

    class Input:
        id = graphene.ID(required=True, description=docs.UpdateTag.id)
        taggable_id = graphene.ID(description=docs.UpdateTag.taggable_id)
        value = graphene.String(required=True, description=docs.UpdateTag.value)

    tag = graphene.Field(lambda: Tag)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        tag_id = args.get('id')
        tag_id = int(Node.from_global_id(tag_id)[1])
        # The tag to replace or edit
        tag = models.Keyword.get(tag_id)
        require_instance_permission(CrudPermissions.UPDATE, tag, context)
        # The context of the mutation (Extract...)
        taggable = None
        taggable_id = args.get('taggable_id', None)
        if taggable_id:
            taggable_node = Node.from_global_id(taggable_id)
            taggable_id = int(taggable_node[1])
            taggable = models.TaggableEntity.get_taggable_from_id(
                taggable_node[0], taggable_id)

        db = tag.db
        value = args.get('value')
        updated_tag = tag
        # The desired tag. None if not exists
        input_tag = models.Keyword.get_tag(value, discussion_id, db)
        if input_tag and taggable:
            # If we have an input_tag and taggable is not null,
            # we replace the current tag by the input_tag
            taggable.replace_tag(tag, input_tag)
            updated_tag = input_tag
        elif input_tag:
            # We can not change the value of the tag by an already existing tag value
            raise Exception("Tag already exists!")
        else:
            # If it's a new value, we replace the value of the current tag
            tag.value = value

        db.flush()
        return UpdateTag(tag=updated_tag)